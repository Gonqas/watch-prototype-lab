import { ACADEMY_CURRICULUM } from './academyCurriculum'

export type WatchmakerJourneyStatus = 'available' | 'foundation' | 'future'

export interface WatchmakerJourneyStage {
  id: string
  routeId: string
  order: number
  title: string
  outcome: string
  scope: string
  status: WatchmakerJourneyStatus
  href: string
}

/** Redirecciones para marcadores creados con el mapa anterior. */
export const WATCHMAKER_JOURNEY_LEGACY_ID_REDIRECTS: Readonly<Record<string, string>> = {
  'journey-statistics': 'journey-engineering-science',
}

type JourneyCopy = Pick<WatchmakerJourneyStage, 'title' | 'outcome' | 'scope' | 'status'> & {
  /** ID anterior cuando la etapa ya existía; evita romper enlaces o estado local. */
  legacyId?: string
}

const JOURNEY_COPY: Record<string, JourneyCopy> = {
  'route.horology.orientation': {
    legacyId: 'journey.systems-language',
    title: 'Orientación: el reloj como sistema',
    outcome: 'Nombrar las piezas básicas y seguir una cadena causal completa antes de responder preguntas técnicas.',
    scope: 'Entrada absoluta: no presupone experiencia, calibre ni herramientas.',
    status: 'available',
  },
  'route.horology.bench-foundations': {
    title: 'Banco, seguridad y manipulación básica',
    outcome: 'Preparar el puesto, observar, manipular y restaurar el estado sin convertir una simulación en práctica física acreditada.',
    scope: 'La Academia permite ensayar digitalmente; el trabajo real exige herramientas, supervisión y registro.',
    status: 'available',
  },
  'route.mechanical.foundations': {
    legacyId: 'journey.mechanical-architecture',
    title: 'Arquitectura mecánica fundamental',
    outcome: 'Explicar barrilete, tren, escape, oscilador, minutería, puesta en hora, automático y calendario como relaciones causales.',
    scope: 'Modelo educativo para comprender funcionamiento antes de calcular o intervenir un calibre.',
    status: 'available',
  },
  'route.encyclopedia.math-physics-metrology': {
    legacyId: 'journey-engineering-science',
    title: 'Matemáticas y física aplicadas',
    outcome: 'Calcular relaciones, energía, par, potencia, frecuencia e inercia con unidades y supuestos explícitos.',
    scope: 'Las herramientas cuantitativas se introducen después del modelo mecánico que explican.',
    status: 'available',
  },
  'route.metrology.physical-digital-bridge': {
    legacyId: 'journey-physical-metrology',
    title: 'Metrología física y puente digital',
    outcome: 'Observar y medir una unidad concreta declarando instrumento, incertidumbre y procedencia.',
    scope: 'Una medida de ejemplar no se convierte automáticamente en dato universal del calibre.',
    status: 'available',
  },
  'route.encyclopedia.mechanical-energy-trains': {
    title: 'Energía, barrilete y tren de ruedas',
    outcome: 'Relacionar almacenamiento, transmisión, relaciones de engrane, reserva e indicación.',
    scope: 'Profundización mecánica y cuantitativa sobre la cadena causal ya aprendida.',
    status: 'available',
  },
  'route.encyclopedia.escapements-chronometry': {
    title: 'Escape, oscilador y cronometría',
    outcome: 'Explicar bloqueo, liberación, impulso, oscilación, marcha y sensibilidad posicional.',
    scope: 'Distingue explicación educativa, medición y validación relojera.',
    status: 'available',
  },
  'route.encyclopedia.service-tribology': {
    title: 'Servicio, fricción y lubricación',
    outcome: 'Razonar sobre limpieza, contacto, lubricación, inspección y aceptación sin inventar procedimientos.',
    scope: 'La práctica digital prepara decisiones; no acredita una intervención física.',
    status: 'available',
  },
  'route.miyota8215.complete': {
    legacyId: 'journey.reference-calibre',
    title: 'Calibre mecánico de referencia',
    outcome: 'Transferir los principios a un ensamblaje documentado y reconocer sus soluciones particulares.',
    scope: 'MIYOTA 8215 es un caso disponible, no una regla universal ni el centro de la Academia.',
    status: 'foundation',
  },
  'route.encyclopedia.cases-water': {
    title: 'Caja, interfaces y hermeticidad',
    outcome: 'Relacionar movimiento, caja, corona, cristal, juntas, esfera y condiciones de uso.',
    scope: 'Prepara el diseño del reloj completo, no solo del movimiento.',
    status: 'available',
  },
  'route.encyclopedia.micromechanics': {
    title: 'Micromecánica y fabricación de componentes',
    outcome: 'Razonar sobre geometría, materiales, procesos, tolerancias, datums e inspección.',
    scope: 'Conecta cálculo y metrología con decisiones fabricables.',
    status: 'available',
  },
  'route.encyclopedia.dials-hands-finishing': {
    title: 'Esfera, agujas y acabados',
    outcome: 'Diseñar interfaces legibles y compatibles y documentar operaciones de acabado.',
    scope: 'Integra función, fabricación, apariencia e inspección.',
    status: 'available',
  },
  'route.advanced.architectures-complications': {
    legacyId: 'journey-movement-design',
    title: 'Arquitecturas y mecanismos avanzados',
    outcome: 'Comparar alternativas y justificar una arquitectura sin transferir datos entre calibres.',
    scope: 'Puente entre el análisis de movimientos existentes y el diseño propio.',
    status: 'foundation',
  },
  'route.capstone.manufacturing-finishing': {
    legacyId: 'journey-cad-manufacturing',
    title: 'Plan de fabricación y acabados',
    outcome: 'Convertir la arquitectura en piezas, procesos, tolerancias, inspecciones y riesgos trazables.',
    scope: 'El expediente digital no sustituye fabricación ni revisión humana.',
    status: 'available',
  },
  'route.capstone.personal-watch-design': {
    legacyId: 'journey-prototype-validation',
    title: 'Diseño progresivo del reloj propio',
    outcome: 'Integrar un movimiento adquirido, controlar una modificación y plantear una arquitectura propia.',
    scope: 'Cada puerta conserva alternativas, riesgos, interfaces y criterios de parada.',
    status: 'available',
  },
  'route.capstone.watch-validation': {
    legacyId: 'journey-capstone',
    title: 'Validación y defensa del proyecto',
    outcome: 'Defender el dossier, transferir criterios y cerrar hallazgos antes de liberar el proyecto.',
    scope: 'La decisión final exige evidencia independiente y revisión humana.',
    status: 'available',
  },
}

/**
 * El mapa profesional no mantiene un segundo orden manual: se deriva de las
 * rutas `core` del currículo canónico. Añadir, quitar o reordenar una etapa
 * obligatoria cambia ambas vistas a la vez.
 */
export const WATCHMAKER_JOURNEY: WatchmakerJourneyStage[] = ACADEMY_CURRICULUM
  .filter(({ role }) => role === 'core')
  .sort((left, right) => left.order - right.order)
  .map((route, index) => {
    const copy = JOURNEY_COPY[route.routeId]
    if (!copy) throw new Error(`Falta la descripción profesional de ${route.routeId}.`)
    const { legacyId, ...content } = copy
    return {
      id: legacyId ?? `journey.${route.routeId.replace(/^route\./, '').replaceAll('.', '-')}`,
      routeId: route.routeId,
      order: index + 1,
      ...content,
      href: `#/learning/route/${route.routeId}`,
    }
  })
