import { z } from 'zod'
import { FidelityProfileSchema } from '../fidelity'

const FundamentalLabSchema = z.object({
  id: z.enum(['energy', 'train', 'escapement', 'oscillator', 'setting', 'automatic']),
  lessonId: z.string().min(1),
  activityId: z.string().min(1),
  theoryBlockId: z.string().min(1),
  minimumTheoryMinutes: z.number().int().min(20),
  sourceIds: z.array(z.string().min(1)).min(2),
  input: z.string().min(1),
  causalStages: z.array(z.string().min(1)).min(3),
  output: z.string().min(1),
  manipulableVariables: z.array(z.string().min(1)).min(1),
  interruption: z.object({
    target: z.string().min(1),
    expectedEffect: z.string().min(1),
  }).strict(),
  readinessCriteria: z.array(z.string().min(1)).min(3),
  fidelity: FidelityProfileSchema,
  offline: z.literal(true),
}).strict()

export type FundamentalMechanicalLab = z.infer<typeof FundamentalLabSchema>

const conceptualFidelity = FidelityProfileSchema.parse({
  geometry: 'G1',
  kinematics: 'K2',
  physics: 'P0',
  limitations: [
    'Geometría pedagógica normalizada; no representa un calibre fabricable.',
    'La coordinación cinemática demuestra causalidad y sentido, no tolerancias ni rendimiento real.',
    'No modela elasticidad real, pérdidas, lubricación, desgaste, choque ni marcha cronométrica.',
  ],
})

const external = {
  ciechanowski: 'source.external.ciechanowski-mechanical-watch',
  animagraffs: 'source.external.animagraffs-mechanical-watch',
  timezone: 'source.external.timezone-illustrated-glossary',
  hodinkee: 'source.external.hodinkee-watch101',
  bobinchak: 'source.external.bobinchak-school',
} as const

const definitions: FundamentalMechanicalLab[] = [
  {
    id: 'energy',
    lessonId: 'lesson.mechanical.energy',
    activityId: 'activity.mechanical.interrupt-energy-chain',
    theoryBlockId: 'block.mechanical.theory.energy',
    minimumTheoryMinutes: 28,
    sourceIds: [external.ciechanowski, external.timezone, 'source.horology.private-book.mainsprings'],
    input: 'energía potencial elástica almacenada por la cuerda',
    causalStages: ['muelle real', 'árbol y tambor del barrilete', 'tren de rodaje', 'escape y oscilador'],
    output: 'liberación dosificada que permite una indicación temporal',
    manipulableVariables: ['nivel de carga normalizado', 'estado bloqueado/libre', 'punto de interrupción'],
    interruption: {
      target: 'salida del barrilete',
      expectedEffect: 'el muelle puede conservar carga, pero el tren situado aguas abajo deja de recibir movimiento',
    },
    readinessCriteria: [
      'Distinguir energía almacenada, par, velocidad y potencia.',
      'Nombrar quién entrega energía y quién regula su liberación.',
      'Predecir qué queda activo a cada lado de una interrupción.',
    ],
    fidelity: conceptualFidelity,
    offline: true,
  },
  {
    id: 'train',
    lessonId: 'lesson.mechanical.train',
    activityId: 'activity.mechanical.build-train',
    theoryBlockId: 'block.mechanical.theory.train',
    minimumTheoryMinutes: 34,
    sourceIds: [external.ciechanowski, external.timezone, external.bobinchak, 'source.horology.private-book.wheels-pinions'],
    input: 'rotación y par entregados por el barrilete',
    causalStages: ['rueda conductora y piñón conducido', 'rueda solidaria al piñón', 'etapas sucesivas', 'rueda de escape'],
    output: 'relación total de velocidades, sentido final y par ideal transformado',
    manipulableVariables: ['número de dientes educativo', 'tipo de engrane', 'etapa acoplada', 'distancia conceptual entre centros'],
    interruption: {
      target: 'una etapa intermedia',
      expectedEffect: 'las etapas anteriores pueden girar y todas las posteriores quedan sin accionamiento',
    },
    readinessCriteria: [
      'Calcular una relación simple sin invertir conductor y conducida.',
      'Determinar el sentido después de varios engranes externos.',
      'Distinguir proximidad visual de engrane declarado.',
    ],
    fidelity: conceptualFidelity,
    offline: true,
  },
  {
    id: 'escapement',
    lessonId: 'lesson.mechanical.escapement',
    activityId: 'activity.mechanical.order-escapement-phases',
    theoryBlockId: 'block.mechanical.theory.escapement',
    minimumTheoryMinutes: 36,
    sourceIds: [external.ciechanowski, external.timezone, external.hodinkee, 'source.horology.private-book.escapements'],
    input: 'par del tren sobre la rueda de escape y retorno del volante',
    causalStages: ['bloqueo en una paleta', 'desbloqueo por la clavija de impulso', 'impulso', 'caída y nuevo bloqueo'],
    output: 'avance discreto del tren y reposición periódica de energía al oscilador',
    manipulableVariables: ['fase discreta', 'velocidad educativa', 'bloqueo de contacto', 'scrub temporal'],
    interruption: {
      target: 'interacción áncora–volante',
      expectedEffect: 'no se produce el ciclo completo de desbloqueo e impulso y el tren permanece retenido',
    },
    readinessCriteria: [
      'Ordenar bloqueo, desbloqueo, impulso, caída y nuevo bloqueo.',
      'Explicar por qué el escape no es la fuente de energía.',
      'Separar una fase conceptual de un ajuste geométrico real.',
    ],
    fidelity: conceptualFidelity,
    offline: true,
  },
  {
    id: 'oscillator',
    lessonId: 'lesson.mechanical.oscillator',
    activityId: 'activity.mechanical.configure-oscillator',
    theoryBlockId: 'block.mechanical.theory.oscillator',
    minimumTheoryMinutes: 32,
    sourceIds: [external.ciechanowski, external.timezone, external.hodinkee, 'source.horology.private-book.balance-spring'],
    input: 'impulso periódico del escape',
    causalStages: ['inercia del volante', 'deformación de la espiral', 'par restaurador', 'paso repetido por el punto de equilibrio'],
    output: 'oscilación que establece el intervalo de liberación del tren',
    manipulableVariables: ['frecuencia educativa', 'amplitud', 'longitud activa simbólica', 'pausa'],
    interruption: {
      target: 'espiral activa',
      expectedEffect: 'desaparece el par restaurador del modelo y deja de existir una oscilación sostenida coherente',
    },
    readinessCriteria: [
      'Distinguir frecuencia, periodo, alternancia y amplitud.',
      'Explicar la función separada de volante y espiral.',
      'No deducir marcha real a partir de una animación normalizada.',
    ],
    fidelity: conceptualFidelity,
    offline: true,
  },
  {
    id: 'setting',
    lessonId: 'lesson.mechanical.keyless',
    activityId: 'activity.mechanical.operate-winding-setting',
    theoryBlockId: 'block.mechanical.theory.setting',
    minimumTheoryMinutes: 30,
    sourceIds: [external.ciechanowski, external.timezone, external.hodinkee, 'source.horology.private-book.wheels-pinions'],
    input: 'giro y posición axial seleccionada por corona y tija',
    causalStages: ['tija', 'piñón corredizo y piñón de canto', 'balancín y tirete', 'rama de cuerda o rama de puesta en hora'],
    output: 'carga del muelle o desplazamiento controlado de la indicación',
    manipulableVariables: ['posición de corona', 'sentido de giro', 'rama acoplada', 'hora indicada'],
    interruption: {
      target: 'acoplamiento del piñón corredizo',
      expectedEffect: 'la corona puede moverse, pero no entrega movimiento a la rama seleccionada',
    },
    readinessCriteria: [
      'Distinguir selección axial de transmisión rotatoria.',
      'Recorrer por separado la cadena de cuerda y la de puesta en hora.',
      'Explicar la fricción de la minutería sin confundirla con un embrague universal.',
    ],
    fidelity: conceptualFidelity,
    offline: true,
  },
  {
    id: 'automatic',
    lessonId: 'lesson.mechanical.automatic-calendar',
    activityId: 'activity.mechanical.follow-automatic-energy',
    theoryBlockId: 'block.mechanical.theory.automatic',
    minimumTheoryMinutes: 30,
    sourceIds: [external.ciechanowski, external.animagraffs, external.hodinkee, 'source.horology.private-book.mainsprings'],
    input: 'rotación oscilante del rotor producida por el movimiento del reloj',
    causalStages: ['rotor y cojinete', 'tren reductor', 'sistema inversor o rueda libre', 'rueda de trinquete y árbol del barrilete'],
    output: 'carga acumulada del muelle sin imponer un sentido único al rotor',
    manipulableVariables: ['sentido del rotor', 'automático habilitado', 'rama inversora', 'carga normalizada'],
    interruption: {
      target: 'módulo inversor',
      expectedEffect: 'el rotor puede girar sin que ese giro se rectifique y llegue al árbol del barrilete',
    },
    readinessCriteria: [
      'Explicar por qué el rotor no da cuerda directamente al muelle.',
      'Distinguir automático unidireccional y bidireccional como familias.',
      'Separar arquitectura conceptual de una solución concreta de calibre.',
    ],
    fidelity: conceptualFidelity,
    offline: true,
  },
]

export const FUNDAMENTAL_MECHANICAL_LABS = FundamentalLabSchema.array().parse(definitions)

export function fundamentalLabForActivity(activityId: string): FundamentalMechanicalLab | undefined {
  const lab = FUNDAMENTAL_MECHANICAL_LABS.find((candidate) => candidate.activityId === activityId)
  return lab ? structuredClone(lab) : undefined
}
