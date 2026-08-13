import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  MANUFACTURING_HAZARDS,
  MANUFACTURING_INSPECTIONS,
  MANUFACTURING_PROCESS_PLANS,
  type ManufacturingProcessPlan,
} from '../src/learning/manufacturing/manufacturing'
import {
  PERSONAL_WATCH_DESIGN_STAGES,
  type PersonalWatchDesignStage,
} from '../src/learning/design/personalWatchDesign'
import {
  ACCESSIBILITY_CHECKS,
  VALIDATION_PARTICIPANT_PROFILES,
  VALIDATION_PROTOCOLS,
  type ValidationProtocol,
} from '../src/learning/validation/academyValidation'

const root = join(process.cwd(), 'learning-content', 'watchmaking-capstone')
const version = '1.0.0'
const packageVersion = '1.1.0'
const packageId = 'wplab.horology.manufacturing-design-validation'
const createdAt = '2026-08-02T00:00:00.000Z'
const fixtureId = 'fixture.conceptual.mechanical-chain'
const L = (es: string, en = es) => ({ es, en })
const unique = <T>(values: T[]) => [...new Set(values)]
const words = (value: string) => value.replace(/[#*`>|]/g, ' ').trim().split(/\s+/).filter(Boolean).length
const writeJson = async (path: string, value: unknown) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
const list = (values: string[]) => values.map((value) => `- ${value}`).join('\n')

type SourceSeed = {
  id: string
  title: string
  locator: string
  organization: string
  claim: string
  kind?: 'web-page' | 'pdf' | 'book'
  authority?: 'official-standards-body' | 'manufacturer-primary' | 'official-miyota' | 'private-book-theory' | 'educational-secondary'
  usage?: 'official-linked' | 'external-linked' | 'private-local'
  sourceClass?: 'official-primary' | 'institutional-training' | 'technical-reference' | 'educational-explainer'
  calibre?: string
}

const sourceSeeds: SourceSeed[] = [
  { id: 'source.iso.286-1', title: 'ISO 286-1:2010 · tolerancias y ajustes', locator: 'https://www.iso.org/standard/45975.html', organization: 'ISO', claim: 'Base normativa para el sistema ISO de tolerancias y ajustes.', authority: 'official-standards-body' },
  { id: 'source.iso.1101', title: 'ISO 1101:2017 · especificación geométrica', locator: 'https://www.iso.org/standard/66777.html', organization: 'ISO', claim: 'Lenguaje normativo para especificar forma, orientación, posición y batimiento.', authority: 'official-standards-body' },
  { id: 'source.iso.21920-1', title: 'ISO 21920-1:2021 · textura superficial', locator: 'https://www.iso.org/standard/72196.html', organization: 'ISO', claim: 'Reglas para indicar textura superficial en documentación técnica.', authority: 'official-standards-body' },
  { id: 'source.iso.14253-1', title: 'ISO 14253-1:2017 · decisión de conformidad', locator: 'https://www.iso.org/standard/70137.html', organization: 'ISO', claim: 'Reglas de decisión considerando incertidumbre de medida.', authority: 'official-standards-body' },
  { id: 'source.iso.22810', title: 'ISO 22810:2010 · resistencia al agua', locator: 'https://www.iso.org/standard/45334.html', organization: 'ISO', claim: 'Requisitos y métodos de ensayo para relojes resistentes al agua.', authority: 'official-standards-body' },
  { id: 'source.iso.14856', title: 'ISO 14856:2001 · correas no metálicas', locator: 'https://www.iso.org/standard/22479.html', organization: 'ISO', claim: 'Métodos de ensayo aplicables a correas no metálicas.', authority: 'official-standards-body' },
  { id: 'source.iso.3160-2', title: 'ISO 3160-2:2015 · recubrimientos de aleación de oro', locator: 'https://committee.iso.org/standard/66162.html', organization: 'ISO', claim: 'Requisitos de espesor, finura y corrosión para recubrimientos definidos.', authority: 'official-standards-body' },
  { id: 'source.iso.9241-11', title: 'ISO 9241-11:2018 · usabilidad', locator: 'https://www.iso.org/standard/63500.html', organization: 'ISO', claim: 'Marco de eficacia, eficiencia y satisfacción en un contexto de uso.', authority: 'official-standards-body' },
  { id: 'source.iso.9241-210', title: 'ISO 9241-210:2019 · diseño centrado en las personas', locator: 'https://www.iso.org/standard/77520.html', organization: 'ISO', claim: 'Actividades y principios de diseño centrado en las personas.', authority: 'official-standards-body' },
  { id: 'source.w3c.wcag22', title: 'Web Content Accessibility Guidelines 2.2', locator: 'https://www.w3.org/TR/WCAG22/', organization: 'W3C', claim: 'Criterios verificables de accesibilidad web.', authority: 'official-standards-body' },
  { id: 'source.niosh.machine-safety', title: 'NIOSH · Machine Safety', locator: 'https://www.cdc.gov/niosh/machine-safety/about/index.html', organization: 'NIOSH', claim: 'Principios públicos de prevención de lesiones con maquinaria.', authority: 'official-standards-body', sourceClass: 'institutional-training' },
  { id: 'source.niosh.metalworking-fluids', title: 'NIOSH · Metalworking Fluids', locator: 'https://www.cdc.gov/niosh/docs/98-116/default.html', organization: 'NIOSH', claim: 'Riesgos y prevención de exposición a fluidos de mecanizado.', authority: 'official-standards-body', sourceClass: 'institutional-training' },
  { id: 'source.osha.metalworking-fluids', title: 'OSHA · Metalworking Fluids', locator: 'https://www.osha.gov/metalworking-fluids/manual', organization: 'OSHA', claim: 'Orientación pública sobre exposición y controles para fluidos de mecanizado.', authority: 'official-standards-body', sourceClass: 'institutional-training' },
  { id: 'source.nist.human-centered-design', title: 'NIST · Human Factors and Human-Centered Design', locator: 'https://www.nist.gov/itl/iad/human-centered-technologies/human-factors-human-centered-design', organization: 'NIST', claim: 'Prácticas de factores humanos y diseño centrado en las personas.', authority: 'official-standards-body', sourceClass: 'institutional-training' },
  { id: 'source.roediger-karpicke.2006', title: 'Roediger & Karpicke (2006) · Test-enhanced learning', locator: 'https://doi.org/10.1111/j.1467-9280.2006.01693.x', organization: 'Psychological Science', claim: 'Evidencia experimental sobre recuperación activa y retención diferida.', authority: 'educational-secondary', usage: 'external-linked', sourceClass: 'technical-reference' },
  { id: 'source.cepeda.2008', title: 'Cepeda et al. (2008) · spacing effects', locator: 'https://pubmed.ncbi.nlm.nih.gov/19076480/', organization: 'Psychological Science', claim: 'Evidencia sobre intervalos de estudio y retención.', authority: 'educational-secondary', usage: 'external-linked', sourceClass: 'technical-reference' },
  { id: 'source.miyota.8215.official', title: 'MIYOTA 8215 · documentación oficial', locator: 'https://miyotamovement.com/product/8215/', organization: 'MIYOTA', claim: 'Identidad y documentación oficial disponible para integrar el calibre 8215.', authority: 'official-miyota', calibre: '8215' },
  { id: 'source.eta.6497-2.communication', title: 'ETA 6497-2 · comunicación técnica', locator: 'https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/', organization: 'ETA', claim: 'Despiece y comunicación técnica oficial del ETA 6497-2.', kind: 'pdf', authority: 'manufacturer-primary' },
  { id: 'source.seiko.6138a.technical-guide', title: 'Seiko 6138A · guía técnica', locator: 'https://seikoserviceusa.com/uploads/datasheets/6138A.pdf', organization: 'Seiko', claim: 'Guía técnica oficial para un caso de transferencia de cronógrafo.', kind: 'pdf', authority: 'manufacturer-primary' },
  { id: 'source.private.horologia-book', title: 'Horologia · libro privado de construcción de relojes mecánicos', locator: 'private-library://horologia-completa', organization: 'Biblioteca privada del usuario', claim: 'Fuente teórica complementaria sobre construcción mecánica; no es documentación MIYOTA.', kind: 'book', authority: 'private-book-theory', usage: 'private-local', sourceClass: 'technical-reference' },
]

const sources = sourceSeeds.map((seed) => ({
  id: seed.id,
  authority: seed.authority ?? 'official-standards-body',
  usage: seed.usage ?? 'official-linked',
  resource: { kind: seed.kind ?? 'web-page', title: seed.title, locator: seed.locator },
  authorOrManufacturer: seed.organization,
  sourceType: seed.authority === 'official-miyota'
    ? 'official-miyota-documentation'
    : seed.authority === 'manufacturer-primary'
      ? 'manufacturer-technical-documentation'
      : seed.authority === 'private-book-theory'
        ? 'private-book'
        : seed.sourceClass === 'technical-reference'
          ? 'curated-external-resource'
          : 'official-metrology-guidance',
  ...(seed.calibre ? { calibre: seed.calibre, revision: 'Página oficial consultada el 2026-08-02.' } : {}),
  retrievedAt: '2026-08-02',
  privateUse: seed.usage === 'private-local',
  authorityTier: (seed.sourceClass ?? (seed.authority === 'private-book-theory' ? 'technical-reference' : 'official-primary')) === 'official-primary' ? 'A' : 'B',
  sourceClass: seed.sourceClass ?? (seed.authority === 'private-book-theory' ? 'technical-reference' : 'official-primary'),
  languages: ['es', 'en'],
  topics: ['fabricación', 'diseño', 'validación'],
  pedagogicalUses: ['theory', 'procedure-contrast'],
  availability: seed.usage === 'private-local' ? 'local' : 'online',
  checkedAt: '2026-08-02',
  rights: seed.usage === 'private-local' ? 'local-private-copy' : 'link-only',
  offlineReady: false,
  validationPolicy: seed.authority === 'private-book-theory'
    ? 'Usar como teoría complementaria; contrastar especificaciones, seguridad y datos de calibre con fuentes primarias.'
    : 'Aplicar únicamente al alcance, edición y revisión citados; comprobar vigencia antes de una decisión física.',
  limitations: ['La fuente no sustituye medición, revisión de plano, evaluación de riesgos ni validación de la unidad física.'],
  supportedClaim: seed.claim,
  derivedLayer: 'source',
}))

const routeDefinitions = {
  manufacturing: {
    id: 'route.capstone.manufacturing-finishing',
    title: 'Fabricación y acabados de un reloj',
    purpose: 'Convertir una intención funcional en planos, procesos, controles y acabados revisables sin fingir experiencia de taller.',
  },
  design: {
    id: 'route.capstone.personal-watch-design',
    title: 'Ruta de diseño de un reloj propio',
    purpose: 'Avanzar desde un movimiento adquirido hasta una arquitectura propia mediante decisiones, interfaces, riesgos y puertas explícitas.',
  },
  validation: {
    id: 'route.capstone.validation',
    title: 'Validación de la Academia y del aprendizaje',
    purpose: 'Someter exactitud, comprensión, transferencia, accesibilidad y retención a protocolos independientes con evidencia.',
  },
} as const

const watchValidationRouteDefinition = {
  id: 'route.capstone.watch-validation',
  title: 'Validación relojera y del aprendizaje',
  purpose: 'Validar el trabajo mediante revisión relojera independiente y transferencia entre calibres, conservando evidencia y límites.',
} as const

type Topic = {
  route: keyof typeof routeDefinitions
  slug: string
  title: string
  subsystem: string
  duration: number
  sourceIds: string[]
  question: string
  theory: string
  contract: Record<string, unknown>
}

function manufacturingTheory(plan: ManufacturingProcessPlan): string {
  const hazards = unique(plan.operations.flatMap(({ hazardIds }) => hazardIds))
    .map((id) => MANUFACTURING_HAZARDS.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const inspections = unique(plan.operations.flatMap(({ inspectionIds }) => inspectionIds))
    .map((id) => MANUFACTURING_INSPECTIONS.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return `## Qué problema resuelve

${plan.purpose} Una pieza relojera no se vuelve fabricable porque tenga un sólido CAD convincente. Debe existir una relación explícita entre función, interfaces, material, referencia geométrica, secuencia, instrumento, regla de decisión y evidencia. La teoría de esta unidad trata el proceso como una cadena causal: cada operación recibe un estado conocido, modifica características concretas y entrega un estado que la siguiente operación debe poder sujetar, localizar e inspeccionar.

En **${plan.title.es}**, diseña desde la función que declara el plan. Una cota aislada no explica qué contacto protege, qué holgura conserva o qué alineación gobierna en esta pieza. Define primero el requisito funcional, después los datums que lo hacen repetible y solo entonces una tolerancia proporcional al riesgo. Una tolerancia más estrecha puede elevar coste, rechazo y dificultad de medida sin mejorar este resultado. La aceptación incorpora la incertidumbre del método y una regla de decisión previa.

## Cadena de proceso propuesta

${plan.operations.map((operation, index) => `${index + 1}. **${operation.title.es}.** ${operation.purpose} Entrada: ${operation.inputState} Salida verificable: ${operation.outputState}`).join('\n')}

Revisa la secuencia de **${plan.operations[0]?.title.es}** a **${plan.operations.at(-1)?.title.es}** también de atrás hacia delante. Para aceptar el resultado final de ${plan.title.es.toLowerCase()}, pregunta qué debe observarse, qué superficie o datum debe seguir disponible y qué sujeción o sobrematerial exigía la operación anterior. Así evitas decorar antes de medir, eliminar una referencia necesaria o bloquear una interfaz con un tratamiento posterior.

## Material, datums y tolerancias

${list(plan.materialDecisions.map(({ question }) => question))}

${plan.datums.map(({ title, controls }) => `- **${title}:** ${controls.join(' ')}`).join('\n')}

${plan.toleranceDecisions.map(({ requirement, verification }) => `- **Requisito:** ${requirement} **Verificación:** ${verification}`).join('\n')}

Selecciona el material de **${plan.title.es}** por propiedades, interfaces y proceso, no por prestigio. Declara estado metalúrgico, estabilidad, corrosión, contacto con piel cuando proceda, respuesta al mecanizado, compatibilidad con unión o recubrimiento y posibilidad real de inspección. Si cambia el material, reabre herramientas, radios, tratamientos, tolerancias y acabado de este plan; no lo trates como una sustitución neutra.

## Seguridad y puntos de parada

${hazards.map((hazard) => `- **${hazard.title.es} (${hazard.severity}):** ${hazard.controls.join(' ')} Detenerse si: ${hazard.stopConditions.join(' ')}`).join('\n')}

Para **${plan.title.es}**, la Academia prepara y revisa el plan, pero no autoriza las operaciones físicas enumeradas. La máquina, material, herramienta, fluido y entorno reales exigen formación presencial, evaluación de riesgos, resguardos, fichas de seguridad y supervisión apropiada. Completar esta animación o expediente no prueba que el proceso se haya realizado de forma segura.

## Inspección y aceptación

${inspections.map((inspection) => `- **${inspection.title.es}:** ${inspection.question} Evidencia: ${inspection.evidence.join(' ')}`).join('\n')}

${plan.acceptanceCriteria.map(({ title, passWhen }) => `- **${title}:** ${passWhen.join(' ')}`).join('\n')}

El expediente de **${plan.title.es}** conserva revisión del plano, material, las ${plan.operations.length} operaciones, parámetros autorizados, instrumentos, condiciones, resultados, desviaciones, no conformidades y firma de revisión. Una superficie hermosa puede ser dimensionalmente incorrecta; una pieza dentro de cota puede fallar por rebaba, contaminación, tensión o pérdida de una referencia. Por eso las ${inspections.length} inspecciones declaradas combinan dimensión, interfaz, función, superficie y trazabilidad.

## Ejercicio de transferencia

Para **${plan.title.es}**, construye dos alternativas entre la primera operación, **${plan.operations[0]?.title.es}**, y la verificación final. Una prioriza acceso y medida intermedia; la otra reduce cambios de sujeción. Compara dónde acumulan error, qué característica podría quedar oculta y qué hallazgo detendría este proceso. Enlaza la decisión con función, riesgo, inspección y coste de recuperación.

## Límite

${plan.physicalBoundary}`
}

function designTheory(stage: PersonalWatchDesignStage): string {
  return `## El propósito de esta puerta

${stage.purpose} Diseñar un reloj propio no consiste en saltar directamente a dibujar puentes. Es una progresión de autoridad: primero se integra un movimiento adquirido sin cambiar su arquitectura; después se estudian modificaciones controladas con interfaces y pruebas; finalmente se propone un movimiento propio. Cada nivel conserva lo aprendido en el anterior y añade incertidumbre, dependencia y responsabilidad.

La puerta **${stage.title.es}** no premia la cantidad de imágenes ni la sofisticación del diseño asistido por ordenador. Decide si existe información suficiente para comprometer tiempo, material y riesgo en la fase siguiente. Su expediente debe permitir que otra persona reconstruya qué se decidió, qué alternativas se descartaron, con qué evidencia, qué sigue abierto y qué resultado obligaría a volver atrás.

## Entradas que deben estar fijadas

${stage.inputs.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

En **${stage.title.es}**, una entrada incierta —por ejemplo, **${stage.inputs[0]?.title}**— se marca con responsable, plan de resolución y fecha. Si cambia la comunicación del fabricante, la unidad medida o el pliego, el registro identifica qué decisiones de esta puerta quedan afectadas. Así una cifra copiada no se convierte silenciosamente en arquitectura del proyecto.

## Interfaces y restricciones

${stage.interfaces.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

${stage.constraints.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

Para superar **${stage.title.es}**, trata cada interfaz —empezando por **${stage.interfaces[0]?.title}**— como un contrato de geometría, posición, movimiento, carga, material, montaje, servicio y verificación. Dos componentes pueden caber por separado y resultar incompatibles al apilar tolerancias. Revisa qué controla la interfaz, qué variación admite, cómo se monta, cómo se inspecciona y qué ocurre cuando falla.

## Alternativas y decisión

La puerta **${stage.title.es}** exige al menos **${stage.alternativesMinimum} alternativas reales**. No cuentan como alternativas la misma solución con otro color: deben cambiar arquitectura, proceso, interfaz o estrategia de validación. La matriz separa requisitos obligatorios de preferencias, usa unidades cuando existen y conserva incertidumbre. Una opción que incumple un requisito bloqueante de esta fase no se rescata sumando ventajas estéticas.

Las preguntas de puerta son:

${list(stage.gateQuestions)}

La decisión de **${stage.title.es}** registra autor, fecha, configuración, alternativas, criterios, evidencia, riesgos y condiciones de reapertura. Su objetivo no es eliminar toda incertidumbre, sino impedir que una incertidumbre crítica de esta puerta quede disfrazada de decisión cerrada.

## Entregables y verificación

${stage.deliverables.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

${stage.verificationPlans.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

En **${stage.title.es}**, diseña la verificación junto al requisito y empieza por **${stage.verificationPlans[0]?.title}**. Si no puedes describir cómo comprobar una afirmación, todavía no es operativa. Distingue cálculo, inspección documental, simulación educativa, prototipo, medición física, prueba de usuario y revisión relojera: ninguna sustituye automáticamente a otra.

## Criterio de salida y parada

${stage.exitCriteria.map((item) => `- **Salir cuando:** ${item}`).join('\n')}
${stage.stopConditions.map((item) => `- **Detener cuando:** ${item}`).join('\n')}

Salir de **${stage.title.es}** no significa que el reloj esté fabricado ni validado; significa que el compromiso siguiente está justificado y los riesgos residuales son visibles. Aplica esta puerta a un caso con movimiento adquirido y a una modificación arquitectónica, e identifica qué datos permanecen válidos y cuáles deben reconstruirse desde cero.`
}

function validationTheory(protocol: ValidationProtocol): string {
  const profiles = protocol.participantProfileIds
    .map((id) => VALIDATION_PARTICIPANT_PROFILES.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const checks = protocol.accessibilityCheckIds
    .map((id) => ACCESSIBILITY_CHECKS.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return `## Qué se intenta validar

${protocol.purpose} Validar no es demostrar que el equipo trabajó mucho. Es intentar refutar una afirmación importante bajo condiciones declaradas. Antes de ejecutar el protocolo se fija la versión del contenido, el calibre o unidad, el perfil de participante, las tareas, las ayudas permitidas, el criterio de éxito y los hallazgos que bloquearían la liberación.

En **${protocol.title.es}**, las dimensiones **${protocol.dimensions.join(', ')}** se valoran por separado. La revisión relojera busca exactitud y seguridad técnica; la prueba principiante, comprensión y acción; la transferencia, aplicación a otro calibre; la accesibilidad, equivalencia de acceso; y la retención diferida, recuperación tras una demora. Superar la dimensión principal de este protocolo no demuestra las demás.

## Participantes y límites de rol

${profiles.map((profile) => `- **${profile.title.es}:** ${profile.inclusion.join(' ')} Límite: ${profile.roleBoundary}`).join('\n')}

La muestra de **${protocol.title.es}** se documenta sin presentarla como universal. El perfil **${profiles[0]?.title.es ?? 'de participante declarado'}** no representa por sí solo a toda la población. Quien diseñó la actividad conoce su lógica; quien revisa accesibilidad no sustituye todas las experiencias; quien observa una operación física no concede competencia. Si el moderador ayuda, se registra y se exige otro intento independiente cuando la ayuda fue sustantiva.

## Tareas y casos

${protocol.tasks.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

${protocol.transferCases.length > 0 ? `Casos de transferencia:\n${protocol.transferCases.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}` : 'Este protocolo no usa un caso de transferencia como criterio principal.'}

${protocol.retentionIntervalsDays.length > 0 ? `Los intentos de retención se separan ${protocol.retentionIntervalsDays.join(', ')} días. Releer inmediatamente no cuenta como recuperación independiente y reinicia la condición del intento.` : 'No se atribuye retención a un resultado inmediato.'}

Las tareas de **${protocol.title.es}**, comenzando por **${protocol.tasks[0]?.title}**, se expresan como resultados observables. Registra camino, errores, dudas, tiempo cuando sea relevante, ayudas, evidencia y explicación posterior. Este protocolo conserva tanto éxitos como fallos: eliminar los fallos falsearía precisamente la robustez que intenta comprobar.

## Accesibilidad y equivalencia

${checks.length > 0 ? checks.map((check) => `- **${check.title.es}:** ${check.observable} Pasa cuando: ${check.passWhen.join(' ')}`).join('\n') : `La accesibilidad sigue siendo un requisito transversal en ${protocol.title.es}, aunque este protocolo no ejecute su matriz completa.`}

En **${protocol.title.es}**, accesible no significa ofrecer una vista secundaria incompleta. La persona debe alcanzar la misma decisión, comprender el mismo estado, guardar la misma evidencia y recuperarse del mismo error mediante las adaptaciones aplicables. La automatización detecta parte de los problemas; la evaluación humana de este protocolo comprueba significado, orden y carga cognitiva.

## Evidencia y aceptación

${protocol.evidenceRequirements.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

${protocol.acceptanceCriteria.map(({ title, detail }) => `- **${title}:** ${detail}`).join('\n')}

La decisión de **${protocol.title.es}** —aceptar, aceptar con condiciones o bloquear— es humana y trazable. Ningún promedio autoriza a ignorar un fallo crítico de este protocolo. Los hallazgos adversos previstos son:

${list(protocol.adverseFindings)}

Las reglas de independencia son:

${list(protocol.independenceRules)}

## Interpretación

Un resultado positivo en **${protocol.title.es}** solo autoriza la afirmación definida por este protocolo y su muestra. Un fallo se reproduce, clasifica por impacto, enlaza a evidencia, asigna responsable y se vuelve a probar. Completa la unidad con una conclusión que incluya alcance, configuración, resultado, excepciones y la evidencia que podría cambiar la decisión.`
}

const topics: Topic[] = [
  ...MANUFACTURING_PROCESS_PLANS.map((plan) => {
    const slug = plan.id.replace('process.manufacturing.', '')
    const hazardIds = unique(plan.operations.flatMap(({ hazardIds }) => hazardIds))
    const inspectionPointIds = unique(plan.operations.flatMap(({ inspectionIds }) => inspectionIds))
    return {
      route: 'manufacturing' as const, slug, title: plan.title.es, subsystem: `manufacturing-${slug}`, duration: 55,
      sourceIds: plan.sourceIds,
      question: `¿Cómo convertir ${plan.title.es.toLowerCase()} en un proceso seguro, medible y revisable?`,
      theory: manufacturingTheory(plan),
      contract: {
        manufacturingContract: {
          processPlanId: plan.id, artifactKinds: plan.artifactKinds, mode: 'process-planning',
          operationIds: plan.operations.map(({ id }) => id), materialDecisionIds: plan.materialDecisions.map(({ id }) => id),
          datumIds: plan.datums.map(({ id }) => id), toleranceDecisionIds: plan.toleranceDecisions.map(({ id }) => id),
          hazardIds, inspectionPointIds, acceptanceCriterionIds: plan.acceptanceCriteria.map(({ id }) => id),
          sourceIds: plan.sourceIds, physicalCompletionClaim: false, supervisedWorkshopRequired: true,
          drawingAndProcessRevisionRequired: true, authorityVisible: true, textualAlternative: true,
        },
      },
    }
  }),
  ...PERSONAL_WATCH_DESIGN_STAGES.map((stage) => ({
    route: 'design' as const, slug: stage.id.replace('design-stage.personal-watch.', ''), title: stage.title.es,
    subsystem: `personal-design-${stage.gate}`, duration: 65, sourceIds: stage.sourceIds,
    question: `¿Qué evidencia permite superar la puerta de ${stage.title.es.toLowerCase()}?`, theory: designTheory(stage),
    contract: {
      personalWatchDesignContract: {
        designStageId: stage.id, routeLevel: stage.routeLevel, gate: stage.gate,
        inputIds: stage.inputs.map(({ id }) => id), interfaceIds: stage.interfaces.map(({ id }) => id),
        constraintIds: stage.constraints.map(({ id }) => id), deliverableIds: stage.deliverables.map(({ id }) => id),
        verificationPlanIds: stage.verificationPlans.map(({ id }) => id), decisionRecordRequired: true,
        alternativesRequired: stage.alternativesMinimum, unresolvedRiskRegisterRequired: true,
        mutatesTechnicalProject: false, humanDesignReviewRequired: true, manufacturingReadinessClaim: false,
        textualAlternative: true,
      },
    },
  })),
  ...VALIDATION_PROTOCOLS.map((protocol) => ({
    route: 'validation' as const, slug: protocol.id.replace('validation.protocol.', ''), title: protocol.title.es,
    subsystem: `validation-${protocol.dimensions[0]}`, duration: 60, sourceIds: protocol.sourceIds,
    question: `¿Cómo ejecutar ${protocol.title.es.toLowerCase()} sin convertir una muestra limitada en una certeza?`,
    theory: validationTheory(protocol),
    contract: {
      validationContract: {
        protocolId: protocol.id, dimensions: protocol.dimensions, participantProfileIds: protocol.participantProfileIds,
        taskIds: protocol.tasks.map(({ id }) => id), transferCaseIds: protocol.transferCases.map(({ id }) => id),
        accessibilityCheckIds: protocol.accessibilityCheckIds, retentionIntervalsDays: protocol.retentionIntervalsDays,
        evidenceRequirementIds: protocol.evidenceRequirements.map(({ id }) => id),
        acceptanceCriterionIds: protocol.acceptanceCriteria.map(({ id }) => id), independentAttemptRequired: true,
        adverseFindingBlocksRelease: true, humanReviewRequired: true, automaticCompetenceClaim: false,
        textualAlternative: true,
      },
    },
  })),
]

const records: Record<string, Array<Record<string, unknown>>> = {
  curricula: [], routes: [], modules: [], concepts: [], misconceptions: [], blocks: [], lessons: [], activities: [], scenes: [],
  competencies: [], evidenceTemplates: [], rubrics: [], glossary: [], sources, recommendations: [], visualResources: [],
}

for (const topic of topics) {
  const prefix = `capstone.${topic.route}.${topic.slug}`
  const activityId = `activity.${prefix}`
  const lessonId = `lesson.${prefix}`
  const moduleId = `module.${prefix}`
  const conceptId = `concept.${prefix}`
  const competencyId = `competency.${prefix}`
  const evidenceId = `evidence.${prefix}`
  const reviewEvidenceId = `${evidenceId}.human-review`
  const rubricId = `rubric.${prefix}`
  const sceneId = `scene.${prefix}`
  const blockId = `block.${prefix}`
  const markdown = `# ${topic.title}\n\n## Pregunta de trabajo\n\n${topic.question}\n\n${topic.theory}\n\n## Comprobación antes de practicar\n\nPara **${topic.title}**, explica el alcance con tus propias palabras, compara al menos dos alternativas, enlaza cada decisión con una fuente o evidencia y declara un hallazgo que obligaría a detener este trabajo. La respuesta queda pendiente de revisión humana; no concede competencia manual, relojera o de ingeniería.\n\n## Cierre\n\nCompleta **${topic.title}** cuando puedas responder «${topic.question}» sin copiar el ejemplo, transferir el método a otro caso y distinguir qué parte es planificación, simulación, observación, medición o validación.`
  const structuredFields = [
    { id: 'field.specification', label: 'Requisitos, hechos y evidencia', kind: 'short-text', required: true, optionIds: [] },
    { id: 'field.alternatives', label: 'Alternativas, interfaces y decisión', kind: 'short-text', required: true, optionIds: [] },
    { id: 'field.risks', label: 'Riesgos, desconocidos y criterio de parada', kind: 'short-text', required: true, optionIds: [] },
    { id: 'field.validation', label: 'Plan de verificación y aceptación', kind: 'short-text', required: true, optionIds: [] },
    { id: 'field.confidence', label: 'Confianza y qué la cambiaría', kind: 'confidence', required: true, optionIds: [] },
  ]
  const tutorContract = {
    scopeConceptIds: [conceptId],
    allowedActions: ['orient', 'ask-socratic-question', 'explain-declared-content', 'point-to-source', 'suggest-remediation', 'summarize-visible-state'],
    forbiddenClaims: [L('No declarar fabricada, segura o validada una pieza por completar un plan digital.'), L('No inventar dimensiones, materiales, resultados, participantes o revisiones.'), L('No sustituir la revisión humana exigida.')],
    promptStarters: [L('¿Qué requisito controla esa decisión?'), L('¿Qué alternativa real descartaste y por qué?'), L('¿Qué hallazgo detendría el proceso?')],
    requiresSourceForTechnicalClaims: true, authority: 'coach-not-assessor',
  }
  records.blocks.push({ id: blockId, version, kind: 'explanation', title: `Teoría · ${topic.title}`, bodyMarkdown: markdown, claims: [], localization: { title: L(`Teoría · ${topic.title}`), bodyMarkdown: L(markdown) }, pedagogy: { role: 'explain', conceptIds: [conceptId], estimatedMinutes: Math.min(120, Math.max(25, Math.ceil(words(markdown) / 170))), userPaced: true } })
  records.concepts.push({ id: conceptId, version, title: L(topic.title), summary: L(topic.question), kind: topic.route === 'manufacturing' ? 'skill' : 'concept', knowledgeType: topic.route === 'manufacturing' ? 'procedural' : 'conceptual-causal', prerequisiteIds: [], recommendedPrerequisiteIds: [], relatedIds: [], competencyIds: [competencyId], movementIds: [], subsystem: topic.subsystem, routeIds: topic.route === 'validation' ? [] : [routeDefinitions[topic.route].id], activityIds: [activityId], sourceIds: topic.sourceIds, misconceptionIds: [], plainLanguage: L(topic.question), technicalLanguage: L(topic.theory.slice(0, 3_500)), whyItMatters: L('Conecta el conocimiento relojero con decisiones fabricables, revisables y comprobables.'), observableActions: [L('Compara alternativas.'), L('Declara interfaces y riesgos.'), L('Define evidencia y criterios de parada.')], transferTargetIds: [], targetEvidenceLevel: 'transfer', availability: 'available' })
  records.competencies.push({ id: competencyId, version, title: topic.title, description: `Defender ${topic.title.toLowerCase()} con fuentes, alternativas, riesgos, verificación y límites.`, prerequisites: [], authoring: { title: L(topic.title), description: L(`Aplicar ${topic.title.toLowerCase()} sin certeza artificial.`), movementIds: [], subsystem: topic.subsystem, skillType: topic.route === 'manufacturing' ? 'procedure' : 'reasoning', sourceIds: topic.sourceIds } })
  records.evidenceTemplates.push({ id: evidenceId, version, competencyId, kind: 'answer', scoringMethod: 'rubric', extraction: { id: `rule.extract.${prefix}`, version, triggerEventType: 'capstone-response-submitted', evidenceType: 'written-response', competencyId, packageId, activityIds: [activityId], evidenceTemplateId: evidenceId, minimumSessionState: ['active', 'paused', 'completed'], confidence: 0.8, contentFields: ['sceneId', 'stepId', 'data', 'sourceIds', 'risks', 'validation'] } })
  records.evidenceTemplates.push({ id: reviewEvidenceId, version, competencyId, kind: 'human-review', scoringMethod: 'rubric', extraction: { id: `rule.extract.${prefix}.human-review`, version, triggerEventType: 'capstone-human-review-completed', evidenceType: 'human-review', competencyId, packageId, activityIds: [activityId], evidenceTemplateId: reviewEvidenceId, minimumSessionState: ['active', 'paused', 'completed'], confidence: 1, contentFields: ['sceneId', 'reviewerId', 'criteria', 'result', 'notes'] } })
  records.rubrics.push({ id: rubricId, version, competencyId, rules: [{ id: `rule.${prefix}.demonstrated`, version, targetState: 'demonstrated', acceptedEvidenceKinds: ['human-review'], minimumEvidence: 1, minimumScore: 0.8, minimumDistinctSessions: 1, minimumSpanDays: 0, explanationTemplate: `${topic.title}: revisión humana de requisitos, alternativas, riesgos, evidencia y límites.` }], assessmentRule: { id: `rule.composite.${prefix}`, version, competencyId, targetState: 'demonstrated', condition: { op: 'all', conditions: [{ op: 'exists', filter: { evidenceType: 'human-review', status: 'active', minimumConfidence: 0.8 } }, { op: 'minimum-evidence', count: 1 }] } } })
  records.scenes.push({ id: sceneId, version, title: `${topic.title} · dossier aplicado`, description: 'Workspace documental posterior a la teoría. No simula una pieza, prueba o revisión inexistentes.', fixtureBinding: { kind: 'fixture', fixtureId }, accessibility: { textualAlternative: 'Pregunta, fuentes, relaciones, riesgos, criterios y respuesta están disponibles íntegramente como texto estructurado.', reducedMotionAlternative: 'No existe movimiento esencial; el proceso se muestra como estados y relaciones.', keyboardActions: ['Recorrer campos con Tab.', 'Guardar con el control nombrado.'], colorIndependentCues: ['Estado, autoridad, riesgo y resultado incluyen texto.'] }, cameraIntent: { intent: 'comparison', transition: 'reduced-motion' }, requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'reduced-motion@^1.0.0', 'viewport.camera@^1.0.0', 'viewport.overlay.labels@^1.0.0'], camera: { position: [6, 5, 7], target: [0, 0, 0], projection: 'perspective', fieldOfView: 42 }, state: { selected: [], visible: [], hidden: [], isolated: [], transparent: [], highlighted: [], explode: 0, speed: 1 }, timeline: [], overlays: [{ kind: 'text', id: `overlay.${prefix}.boundary`, markdown: 'Planificación y validación documental. Sin declaración automática de fabricación, competencia física o liberación.', accessibleLabel: 'Límite de autoridad de la actividad.' }], steps: [{ id: `step.${prefix}.respond`, instructionMarkdown: `${topic.question} Construye un expediente defendible después de estudiar la teoría y las fuentes.`, questions: [{ id: `question.${prefix}.response`, promptMarkdown: `Resuelve **${topic.title}** separando especificación, alternativas, riesgos, verificación y confianza.`, responseKind: 'structured-response', options: [], structuredFields, hints: [], humanReviewRequired: true, authoring: { prompt: L(topic.question), feedback: L('La respuesta queda pendiente de revisión humana; completarla no prueba fabricación ni validación física.') } }], success: [{ condition: 'structured-answer', questionId: `question.${prefix}.response`, requiredFieldIds: structuredFields.map(({ id }) => id), pendingHumanReview: true }] }], restorePreviousState: true })
  const authoring = {
    lessonId, title: L(topic.title), description: L(`Estudio aplicado: ${topic.question}`), difficulty: 'advanced', durationMinutes: topic.duration,
    activityType: 'guided-practice', movementIds: [], familyIds: [], subsystem: topic.subsystem,
    requiredCapabilities: ['learning.scene-runtime', 'reduced-motion'], languages: ['es-ES'], offline: true,
    fidelity: { geometry: 'G0', kinematics: 'K0', physics: 'P0', limitations: ['Workspace documental: no presenta geometría ni física inexistentes.', 'No inventa dimensiones ni resultados.', 'La evidencia digital no acredita destreza física ni libera un producto.'] },
    warnings: { es: ['Comprueba revisión, fuente, unidad y contexto antes de ejecutar una decisión física.', 'Detente ante cualquier riesgo crítico o dato no controlado.'], en: [] },
    sourceIds: topic.sourceIds, visualResourceIds: [], fixtureBinding: { kind: 'fixture', fixtureId },
    interactionContract: { responseModel: 'structured-response', orderedItems: [], expectedOrderIds: [], structuredFields: structuredFields.map(({ id, label, kind, required }) => ({ id, label: L(label), kind, required })), hints: [], evidencePolicy: { eventType: 'capstone-response-submitted', recordsAnswerPayload: true, deterministicComponents: [], requiresHumanReview: true, accessibilityAdaptationsCountAsHints: false } },
    pedagogicalContract: { purpose: topic.route === 'validation' ? 'transfer' : 'guided-practice', assessmentIntent: 'formative', requiresConceptIds: [conceptId], introducesConceptIds: [], demonstratesConceptIds: [], practicesConceptIds: [conceptId], assessesConceptIds: [conceptId], evidenceLevel: 'transfer', supportLevel: topic.route === 'validation' ? 'independent' : 'guided', remediation: { lessonId, blockId, conceptIds: [conceptId] }, physicalBoundary: L('Evalúa planificación y razonamiento. La fabricación, revisión profesional y validación física requieren personas, condiciones y evidencia reales.') },
    feedbackContract: { correctExplanation: L('El expediente conserva requisitos, alternativas, riesgos, evidencia, aceptación y límites.'), incorrectDiagnosis: L('Revisa si convertiste una suposición en hecho, omitiste una interfaz o aceptaste sin criterio de parada.'), causalQuestion: L(topic.question), nextObservation: L('Localiza la primera decisión sin alternativa o la primera aceptación sin evidencia.'), misconceptionIds: [], transferPrompt: L('Aplica el mismo método a otra pieza, arquitectura, calibre o perfil de usuario.'), requiresIndependentRetryAfterHint: true },
    tutorContract, pedagogicalPattern: { enabled: true, stages: ['observe', 'predict', 'compare', 'explain', 'relate-to-real-object', 'record-evidence'] },
    ...topic.contract,
  }
  records.activities.push({ id: activityId, version, title: topic.title, sceneIds: [sceneId], competencyIds: [competencyId], evidenceTemplateIds: [evidenceId, reviewEvidenceId], rubricId, projectReference: { kind: 'fixture-readonly', fixtureId }, authoring })
  records.lessons.push({ id: lessonId, version, title: topic.title, blockIds: [blockId], activityIds: [activityId], authoring: { title: L(topic.title), purpose: L(topic.question), objectives: [L('Explicar la teoría antes de abrir el expediente.'), L('Comparar alternativas y hacer visibles interfaces y riesgos.'), L('Definir verificación, aceptación y criterio de parada.')], prerequisiteConceptIds: [], recommendedPrerequisiteConceptIds: [], externalPrerequisites: [{ packageId: 'wplab.horology.advanced-architecture-service', versionRange: '^1.0.0', moduleIds: ['module.advanced.architecture-capstone'], competencyIds: ['competency.advanced.architecture-capstone'], recommendedButOptionalRouteIds: ['route.advanced.architectures-complications'] }], conceptIds: [conceptId], sourceIds: topic.sourceIds, visualResourceIds: [], pedagogy: { role: topic.route === 'validation' ? 'transfer' : 'conceptual-model', entryCheck: 'self-check', userPacedSegments: true, introducesConceptIds: [conceptId], reinforcesConceptIds: [], bridgeConceptIds: [] }, studyContract: { sequence: 'theory-first', minimumTheoryMinutes: Math.max(25, Math.ceil(words(markdown) / 170)), minimumReadingWords: words(markdown), requiredSegmentRoles: ['orient', 'pretrain', 'explain', 'worked-example', 'practice', 'close'], practiceUnlock: 'after-required-reading', labActivityIds: [activityId], readinessCriteria: [L('Puedo reconstruir la decisión sin copiar el ejemplo.'), L('Puedo comparar alternativas y declarar interfaces y riesgos.'), L('Puedo definir evidencia, aceptación y criterio de parada.')], sourceReviewRequired: true, notePrompt: L('Anota un requisito, una alternativa descartada, un riesgo abierto y la prueba que resolvería la duda.') }, tutorContract } })
  records.modules.push({ id: moduleId, version, title: L(topic.title), purpose: L(topic.question), lessonIds: [lessonId] })
}

function addRoute(
  routeKey: keyof typeof routeDefinitions,
  routeTopics: Topic[],
  definition: { id: string; title: string; purpose: string },
  demo: boolean,
  milestoneNamespace: string = routeKey,
) {
  const conceptIds = routeTopics.map(({ slug }) => `concept.capstone.${routeKey}.${slug}`)
  conceptIds.forEach((conceptId, index) => {
    const concept = records.concepts.find(({ id }) => id === conceptId)
    if (!concept) return
    concept.prerequisiteIds = index > 0 ? [conceptIds[index - 1]] : []
    concept.relatedIds = [conceptIds[index - 1], conceptIds[index + 1]].filter(Boolean)
    concept.transferTargetIds = index < conceptIds.length - 1 ? [conceptIds[index + 1]] : [conceptIds[0]]
    // Cada protocolo de validación pertenece a una sola superficie. Los tres
    // controles internos no deben filtrarse a la ruta estudiantil, y los dos
    // hitos del estudiante no deben aparecer como pruebas internas de producto.
    concept.routeIds = [definition.id]
  })
  const activityIds = routeTopics.map(({ slug }) => `activity.capstone.${routeKey}.${slug}`)
  const lessonIds = routeTopics.map(({ slug }) => `lesson.capstone.${routeKey}.${slug}`)
  records.routes.push({ id: definition.id, version, title: L(definition.title), purpose: L(definition.purpose), prerequisiteConceptIds: [], moduleIds: routeTopics.map(({ slug }) => `module.capstone.${routeKey}.${slug}`), competencyIds: routeTopics.map(({ slug }) => `competency.capstone.${routeKey}.${slug}`), movementIds: [], difficulty: 'advanced', sourceIds: unique(routeTopics.flatMap(({ sourceIds }) => sourceIds)), visualResourceIds: [], demo, learningDesign: { model: 'specialization', entryPolicy: 'prerequisite-required', completionPolicy: 'evidence', milestones: routeTopics.map((topic, index) => ({ id: `milestone.capstone.${milestoneNamespace}.${String(index + 1).padStart(2, '0')}`, order: index + 1, title: L(topic.title), outcome: L(topic.question), lessonId: lessonIds[index], activityId: activityIds[index], mode: routeKey === 'validation' ? 'transfer' : 'guided-practice', evidenceLevel: 'transfer', optional: false, transferTargetIds: [conceptIds[index]] })), diagnosticActivityIds: [], demonstrationActivityIds: activityIds } })
}

for (const routeKey of Object.keys(routeDefinitions) as Array<keyof typeof routeDefinitions>) {
  const routeTopics = topics.filter(({ route }) => route === routeKey)
  if (routeKey !== 'validation') {
    addRoute(routeKey, routeTopics, routeDefinitions[routeKey], false)
    continue
  }
  const internalValidationSlugs = new Set(['beginner-usability', 'accessibility', 'deferred-retention'])
  const watchValidationSlugs = new Set(['watchmaker-review', 'calibre-transfer'])
  addRoute(routeKey, routeTopics.filter(({ slug }) => internalValidationSlugs.has(slug)), routeDefinitions.validation, true)
  addRoute(routeKey, routeTopics.filter(({ slug }) => watchValidationSlugs.has(slug)), watchValidationRouteDefinition, false, 'watch-validation')
}

records.curricula.push({ id: 'curriculum.personal-watch.capstone', version, title: L('Fabricar, diseñar y validar un reloj propio'), purpose: L('Cerrar la ruta personal desde procesos de fabricación y acabados hasta un reloj propio revisado y un sistema de validación conservador.'), routeIds: [routeDefinitions.manufacturing.id, routeDefinitions.design.id, watchValidationRouteDefinition.id], languages: ['es-ES'] })

const entryFolders: Record<string, string> = { curricula: 'curriculum', routes: 'routes', modules: 'modules', concepts: 'concepts', misconceptions: 'misconceptions', blocks: 'blocks', lessons: 'lessons', activities: 'activities', scenes: 'scenes', competencies: 'competencies', evidenceTemplates: 'evidence', rubrics: 'rubrics', glossary: 'glossary', sources: 'sources', recommendations: 'recommendations', visualResources: 'visual-resources' }
const entries = Object.fromEntries(Object.entries(entryFolders).map(([key, folder]) => [key, records[key].map(({ id }) => ({ id, path: `${folder}/${id}.json` }))]))
const manifest = { format: 'wplab-learning-pack', formatVersion: 1, schemaId: 'learning-pack-v1', packageVersion, id: packageId, title: 'Fabricación, diseño propio y validación', distribution: 'local-unsigned', editorialStatus: 'approved', authors: [{ name: 'Watch Prototype Lab' }], languages: ['es-ES'], dependencies: [{ packageId: 'wplab.horology.advanced-architecture-service', versionRange: '^1.0.0' }, { packageId: 'wplab.horology.inspection-metrology', versionRange: '^0.1.0' }], requiredCapabilities: ['learning.scene-runtime@^1.0.0', 'reduced-motion@^1.0.0', 'viewport.camera@^1.0.0', 'viewport.overlay.labels@^1.0.0'], movements: [{ manufacturer: 'Conceptual', calibre: 'mechanical-chain', referenceId: fixtureId }, { manufacturer: 'MIYOTA', calibre: '8215', referenceId: 'fixture.miyota.8215.structural' }], assets: [], entries, minimumAppVersion: '0.10.0', createdAt }
const pack = { manifest, ...records }

await rm(root, { recursive: true, force: true })
for (const [key, folder] of Object.entries(entryFolders)) {
  for (const record of records[key]) await writeJson(join(root, folder, `${record.id}.json`), record)
}
await writeJson(join(root, 'manifest.json'), manifest)
await writeJson(join(root, 'dist', 'pack.json'), pack)
await writeJson(join(root, 'generated', 'summary.json'), {
  packageId, packageVersion, contentVersion: version, routes: records.routes.length, modules: records.modules.length, lessons: records.lessons.length,
  activities: records.activities.length, theoryWords: records.blocks.reduce((sum, block) => sum + words(String(block.bodyMarkdown)), 0),
  sources: records.sources.length, generatedAt: createdAt,
})

console.log(JSON.stringify({ packageId, packageVersion, contentVersion: version, routes: records.routes.length, lessons: records.lessons.length, activities: records.activities.length, theoryWords: records.blocks.reduce((sum, block) => sum + words(String(block.bodyMarkdown)), 0), sources: records.sources.length }, null, 2))
