import {
  defaultExteriorSpec,
  defaultEngineeringSettings,
  defaultPresentationSpec,
  dimension,
  newProjectId,
  type ComponentOrigin,
  type HandSpec,
  type MechanicalArbor,
  type MechanicalMovementSpec,
  type QuartzMovementSpec,
  type WatchProject,
} from './model'
import { miyotaMovement, miyotaSourceReferences } from './miyotaCatalog'

const MIYOTA_FRAME = 'Miyota frame drawing 20350000/20360000'
const MIYOTA_DIAL = 'Miyota dial drawing 203500D1/203600D1'
const DANIELS_TRAIN = 'Horologia, cap. 5 Wheels and Pinions, pp. 113-121'
const DANIELS_LAYOUT = 'Horologia, cap. 10 Movement Design, pp. 280-282'

function templateOrigin(component: string): ComponentOrigin {
  return {
    kind: 'designed',
    sourceMovement: 'Daniels 34 mm reference architecture',
    manufacturer: 'Watch Prototype Lab',
    reference: `${DANIELS_LAYOUT} · ${component}`,
    capturedAt: new Date().toISOString(),
    notes: 'Componente parametrico inicial; reemplazable por una pieza donante medida o importada.',
    reliability: 'medium',
  }
}

function hand(
  length: number,
  width: number,
  thickness: number,
  mountingHeight: number,
  tubeHeight: number,
  holeDiameter: number,
  color: string,
): HandSpec {
  return {
    enabled: true,
    length: dimension(length, 'mm', 'supplier_partial', 'Plantilla editable de aguja', 0.1),
    width: dimension(width, 'mm', 'estimated', 'Plantilla parametrica', 0.04),
    thickness: dimension(thickness, 'mm', 'estimated', 'Pendiente de medir', 0.02),
    mountingHeight: dimension(mountingHeight, 'mm', 'official_partial', MIYOTA_FRAME, 0.05),
    tubeHeight: dimension(tubeHeight, 'mm', 'supplier_partial', 'Altura de tubo pendiente de confirmar', 0.08),
    holeDiameter: dimension(holeDiameter, 'mm', 'official_complete', MIYOTA_FRAME, 0.01),
    curve: {
      base: dimension(0, 'mm', 'estimated'),
      middle: dimension(0, 'mm', 'estimated'),
      tip: dimension(0, 'mm', 'estimated'),
      startRatio: 0.35,
      endRatio: 0.85,
    },
    color,
  }
}

export function createQuartzMovement(calibre: 'miyota_2035' | 'miyota_2036'): QuartzMovementSpec {
  const high = calibre === 'miyota_2036'
  return {
    kind: 'quartz',
    presetId: calibre,
    name: high ? 'Miyota 2036' : 'Miyota 2035',
    width: dimension(15.3, 'mm', 'official_complete', MIYOTA_FRAME, 0.05),
    length: dimension(18.5, 'mm', 'official_complete', MIYOTA_FRAME, 0.05),
    thickness: dimension(3.15, 'mm', 'official_complete', MIYOTA_FRAME, 0.05),
    casingWidth: dimension(18.2, 'mm', 'official_complete', MIYOTA_FRAME, 0.05),
    casingLength: dimension(17.8, 'mm', 'official_complete', MIYOTA_FRAME, 0.05),
    stemAxisZ: dimension(1.55, 'mm', 'official_partial', MIYOTA_FRAME, 0.08),
    handFit: {
      hour: dimension(1.2, 'mm', 'official_complete', MIYOTA_FRAME, 0.025),
      minute: dimension(0.7, 'mm', 'official_complete', MIYOTA_FRAME, 0.005),
      second: dimension(0.17, 'mm', 'official_complete', MIYOTA_FRAME, 0.004),
    },
    handBaseLevels: {
      hour: dimension(high ? 0.5 : 0.35, 'mm', 'official_partial', MIYOTA_FRAME, 0.05),
      minute: dimension(high ? 0.95 : 0.72, 'mm', 'official_partial', MIYOTA_FRAME, 0.05),
      second: dimension(high ? 1.58 : 1.18, 'mm', 'official_partial', MIYOTA_FRAME, 0.08),
    },
  }
}

function arbor(
  id: MechanicalArbor['id'],
  name: string,
  x: number,
  y: number,
  wheelTeeth: number,
  pinionTeeth: number,
  moduleToNext: number,
  wheelZ: number,
  pinionZ: number,
): MechanicalArbor {
  return {
    id,
    name,
    x: dimension(x, 'mm', 'estimated', DANIELS_LAYOUT, 0.02),
    y: dimension(y, 'mm', 'estimated', DANIELS_LAYOUT, 0.02),
    wheelTeeth: dimension(wheelTeeth, 'count', 'estimated', DANIELS_TRAIN),
    pinionTeeth: dimension(pinionTeeth, 'count', 'estimated', DANIELS_TRAIN),
    moduleToNext: dimension(moduleToNext, 'mm', 'estimated', DANIELS_TRAIN, 0.005),
    profileToNext: 'cycloidal',
    wheelThickness: dimension(id === 'barrel' ? 0.22 : 0.16, 'mm', 'estimated', DANIELS_LAYOUT, 0.02),
    pinionThickness: dimension(id === 'center' ? 0.3 : 0.24, 'mm', 'estimated', DANIELS_LAYOUT, 0.02),
    wheelZ: dimension(wheelZ, 'mm', 'estimated', DANIELS_LAYOUT, 0.03),
    pinionZ: dimension(pinionZ, 'mm', 'estimated', DANIELS_LAYOUT, 0.03),
    pivotDiameter: dimension(id === 'barrel' ? 0.8 : 0.2, 'mm', 'estimated', 'Plantilla de fabricacion', 0.01),
    pivotLength: dimension(id === 'barrel' ? 1.4 : 0.85, 'mm', 'estimated', 'Plantilla de fabricacion', 0.03),
    pressureAngle: dimension(20, 'deg', 'designed', 'Perfil involuta de proyecto'),
    profileShift: dimension(0, 'count', 'designed', 'Perfil involuta de proyecto'),
    backlash: dimension(0.025, 'mm', 'designed', 'Holgura tangencial de proyecto', 0.008),
    addendumCoefficient: dimension(1, 'count', 'designed', 'Perfil involuta de proyecto'),
    dedendumCoefficient: dimension(1.25, 'count', 'designed', 'Perfil involuta de proyecto'),
    endshake: dimension(0.04, 'mm', 'designed', 'Objetivo de montaje', 0.015),
    sideshake: dimension(0.015, 'mm', 'designed', 'Objetivo de montaje', 0.006),
    jewelHoleDiameter: dimension(id === 'barrel' ? 0.82 : 0.22, 'mm', 'designed', 'Joya parametrica', 0.005),
    jewelOuterDiameter: dimension(id === 'barrel' ? 2.5 : 1.5, 'mm', 'designed', 'Joya parametrica', 0.02),
  }
}

export function createMechanicalMovement(): MechanicalMovementSpec {
  return {
    kind: 'mechanical',
    presetId: 'daniels_manual_34',
    name: 'Movimiento manual 34 mm',
    buildMode: 'template',
    componentOrigins: {
      plate: templateOrigin('platina'),
      bridge: templateOrigin('puentes'),
      barrel: templateOrigin('barrilete'),
      center: templateOrigin('rueda de centro'),
      third: templateOrigin('tercera rueda'),
      fourth: templateOrigin('cuarta rueda'),
      escape: templateOrigin('rueda de escape'),
      balance: templateOrigin('volante'),
      pallet: templateOrigin('ancora'),
      hairspring: templateOrigin('espiral'),
      mainspring: templateOrigin('muelle real'),
      keyless: templateOrigin('remontuar'),
      'jewel-set': templateOrigin('rubies'),
    },
    architecture: 'manual',
    plateDiameter: dimension(34, 'mm', 'estimated', DANIELS_LAYOUT, 0.05),
    plateThickness: dimension(0.6, 'mm', 'estimated', DANIELS_LAYOUT, 0.03),
    trainBaseZ: dimension(0, 'mm', 'designed', 'Datum inferior del tren manual', 0.02),
    totalHeight: dimension(4.8, 'mm', 'estimated', DANIELS_LAYOUT, 0.1),
    bridgeThickness: dimension(0.45, 'mm', 'estimated', DANIELS_LAYOUT, 0.03),
    bridgeTopZ: dimension(4.8, 'mm', 'designed', 'Plano superior independiente del puente', 0.03),
    edgeClearance: dimension(0.6, 'mm', 'estimated', 'Margen de diseno editable', 0.05),
    barrelTurns: dimension(6.5, 'count', 'estimated', 'Horologia, cap. 9 Mainsprings', 0.25),
    targetPowerReserve: dimension(52, 'h', 'estimated', 'Objetivo de proyecto', 2),
    stemAxisZ: dimension(1.8, 'mm', 'estimated', 'Pendiente de disenar mecanismo de remontuar', 0.1),
    automatic: {
      rotorDiameter: dimension(31.5, 'mm', 'estimated', 'Modulo automatico parametrico', 0.1),
      rotorThickness: dimension(0.65, 'mm', 'estimated', 'Modulo automatico parametrico', 0.05),
      rotorZ: dimension(0.15, 'mm', 'estimated', 'Lado fondo, sobre la envolvente inferior', 0.05),
      bearingDiameter: dimension(3.2, 'mm', 'estimated', 'Cojinete de rotor parametrico', 0.03),
      rotorMass: dimension(3.2, 'count', 'estimated', 'Masa inicial del rotor, g', 0.4),
      centerOfMassRadius: dimension(6.5, 'mm', 'estimated', 'Excentricidad inicial del centro de masa', 0.6),
      bearingFrictionTorque: dimension(0.006, 'count', 'estimated', 'Par resistente del cojinete, N mm', 0.003),
      rotorToBarrelRatio: dimension(140, 'count', 'estimated', 'Relacion rotor a barrilete', 15),
      motionFrequency: dimension(0.55, 'count', 'estimated', 'Escenario de uso activo, Hz', 0.18),
      motionSweep: dimension(110, 'deg', 'estimated', 'Arco medio por ciclo de uso', 25),
      activeHoursPerDay: dimension(2.5, 'h', 'estimated', 'Escenario de movimiento activo diario', 1),
      windingEfficiency: dimension(0.62, 'count', 'estimated', 'Eficiencia inicial de carga automatica', 0.08),
      reverserType: 'bidirectional',
    },
    mainspring: {
      thickness: dimension(0.11, 'mm', 'estimated', 'Modelo inicial de muelle real', 0.01),
      height: dimension(1.3, 'mm', 'estimated', 'Modelo inicial de muelle real', 0.03),
      length: dimension(320, 'mm', 'estimated', 'Longitud desplegada inicial', 8),
      elasticModulus: dimension(190000, 'count', 'estimated', 'Acero de muelle, valor de referencia', 10000),
      turnsWorking: dimension(6.5, 'count', 'designed', 'Rango util del barrilete', 0.25),
    },
    escapement: {
      type: 'swiss-lever',
      targetVph: dimension(21600, 'vph', 'estimated', 'Objetivo de proyecto'),
      liftAngle: dimension(52, 'deg', 'estimated', 'Valor inicial editable', 2),
      lock: dimension(1.5, 'deg', 'designed', 'Escape suizo parametrico', 0.2),
      drop: dimension(1.2, 'deg', 'designed', 'Escape suizo parametrico', 0.2),
      draw: dimension(12, 'deg', 'designed', 'Escape suizo parametrico', 1),
      impulseAngle: dimension(44, 'deg', 'designed', 'Escape suizo parametrico', 1),
      efficiency: dimension(0.32, 'count', 'estimated', 'Presupuesto energetico inicial', 0.05),
    },
    balance: {
      x: dimension(-5.3, 'mm', 'estimated', DANIELS_LAYOUT, 0.02),
      y: dimension(-6.2, 'mm', 'estimated', DANIELS_LAYOUT, 0.02),
      diameter: dimension(9.5, 'mm', 'estimated', 'Plantilla parametrica', 0.05),
      thickness: dimension(0.35, 'mm', 'estimated', 'Plantilla parametrica', 0.03),
      z: dimension(2.35, 'mm', 'estimated', DANIELS_LAYOUT, 0.04),
      targetAmplitude: dimension(270, 'deg', 'estimated', 'Objetivo de regulacion', 15),
      mass: dimension(0.00012, 'count', 'estimated', 'Masa de volante inicial', 0.00002),
      inertia: dimension(8.6e-10, 'count', 'estimated', 'Inercia polar inicial', 1.5e-10),
      hairspringStiffness: dimension(3.05e-7, 'count', 'estimated', 'Rigidez torsional inicial', 0.5e-8),
      dampingRatio: dimension(0.002, 'count', 'estimated', 'Q aproximado 250; pendiente de calibrar', 0.0007),
    },
    motionWorks: {
      hourFit: dimension(1.5, 'mm', 'estimated', 'Canones por disenar', 0.02),
      minuteFit: dimension(0.9, 'mm', 'estimated', 'Canones por disenar', 0.02),
      secondFit: dimension(0.25, 'mm', 'estimated', 'Canones por disenar', 0.01),
    },
    arbors: [
      arbor('barrel', 'Barrilete', -7.612, 2.77, 96, 1, 0.15, 0.85, 0.85),
      arbor('center', 'Rueda de centro', 0, 0, 80, 12, 0.12, 1.25, 0.85),
      arbor('third', 'Tercera rueda', 4.423, 3.097, 75, 10, 0.11, 1.62, 1.25),
      arbor('fourth', 'Cuarta rueda', 5.235, -1.507, 80, 10, 0.1, 1.98, 1.62),
      arbor('escape', 'Escape', 1.101, -3.012, 18, 8, 0.18, 2.32, 1.98),
    ],
  }
}

function baseProject(name: string): Omit<WatchProject, 'movement'> {
  const now = new Date().toISOString()
  return {
    schemaVersion: 5,
    id: newProjectId(),
    name,
    createdAt: now,
    modifiedAt: now,
    notes: '',
    assembly: {
      movementBackClearance: dimension(0.05, 'mm', 'estimated', 'Holgura de montaje editable', 0.02),
      dialMovementGap: dimension(0.1, 'mm', 'estimated', 'Separacion funcional editable', 0.03),
      runningClearance: dimension(0.08, 'mm', 'estimated', 'Margen dinamico de proyecto', 0.02),
      mates: [
        {
          id: 'mate-movement-case',
          name: 'Movimiento centrado en caja',
          type: 'concentric',
          sourcePart: 'movement',
          targetPart: 'case',
          enabled: true,
          axis: 'z',
        },
        {
          id: 'mate-movement-back-z',
          name: 'Movimiento apoyado sobre el fondo',
          type: 'distance',
          sourcePart: 'movement',
          targetPart: 'back',
          enabled: true,
          axis: 'z',
          offset: dimension(0.05, 'mm', 'designed', 'Separacion de montaje', 0.02),
        },
        {
          id: 'mate-movement-clock',
          name: 'Orientacion de tija a las 3H',
          type: 'angle',
          sourcePart: 'movement',
          targetPart: 'case',
          enabled: true,
          axis: 'z',
          angle: dimension(0, 'deg', 'designed', 'Referencia 3H', 0.2),
        },
        {
          id: 'mate-dial-center',
          name: 'Dial centrado sobre movimiento',
          type: 'concentric',
          sourcePart: 'dial',
          targetPart: 'movement',
          enabled: true,
          axis: 'z',
        },
        {
          id: 'mate-dial-movement-z',
          name: 'Dial sobre movimiento',
          type: 'distance',
          sourcePart: 'dial',
          targetPart: 'movement',
          enabled: true,
          axis: 'z',
          offset: dimension(0.1, 'mm', 'designed', 'Separacion de montaje', 0.03),
        },
        {
          id: 'mate-dial-clock',
          name: 'Pies de dial orientados',
          type: 'angle',
          sourcePart: 'dial',
          targetPart: 'movement',
          enabled: true,
          axis: 'z',
          angle: dimension(0, 'deg', 'designed', 'Referencia de pies de dial', 0.2),
        },
        {
          id: 'mate-crystal-case',
          name: 'Cristal concentricamente asentado',
          type: 'concentric',
          sourcePart: 'crystal',
          targetPart: 'case',
          enabled: true,
          axis: 'z',
        },
      ],
    },
    engineering: defaultEngineeringSettings(),
    case: {
      shape: 'round',
      material: 'steel',
      outerDiameter: dimension(42, 'mm', 'supplier_partial', 'Caja parametrica inicial', 0.05),
      innerDiameter: dimension(36, 'mm', 'estimated', 'Pendiente de medir interior real', 0.1),
      totalHeight: dimension(11.5, 'mm', 'supplier_partial', 'Caja parametrica inicial', 0.1),
      usableInteriorHeight: dimension(9.1, 'mm', 'estimated', 'Pendiente de medir bajo cristal', 0.2),
      backThickness: dimension(1.2, 'mm', 'estimated', 'Pendiente de medir fondo', 0.1),
      wallThickness: dimension(2, 'mm', 'estimated', 'Modelo parametrico', 0.1),
      dialSeatDiameter: dimension(34.6, 'mm', 'estimated', 'Pendiente de medir asiento', 0.08),
      crystalSeatDiameter: dimension(36.8, 'mm', 'estimated', 'Pendiente de medir asiento', 0.08),
      stemAxisZ: dimension(3, 'mm', 'estimated', 'Pendiente de alinear con movimiento', 0.15),
      crownDistance: dimension(23.8, 'mm', 'estimated', 'Modelo parametrico', 0.15),
      crownDiameter: dimension(6.5, 'mm', 'supplier_partial', 'Corona parametrica', 0.05),
      crownTubeDiameter: dimension(2.5, 'mm', 'supplier_partial', 'Tubo parametrico', 0.05),
      lugSpacing: dimension(20, 'mm', 'supplier_partial', 'Ancho entre asas editable', 0.05),
      lugWidth: dimension(3, 'mm', 'estimated', 'Geometria parametrica de caja', 0.05),
      lugLength: dimension(5.2, 'mm', 'estimated', 'Geometria parametrica de caja', 0.1),
    },
    exterior: defaultExteriorSpec(42, 20),
    presentation: defaultPresentationSpec(),
    crystal: {
      type: 'box',
      diameter: dimension(36.6, 'mm', 'estimated', 'Pendiente de medir cristal', 0.08),
      thickness: dimension(1, 'mm', 'estimated', 'Pendiente de medir cristal', 0.1),
      innerRise: dimension(0.7, 'mm', 'estimated', 'Perfil box parametrico', 0.12),
    },
    dial: {
      color: '#244b3d',
      finish: 'matte',
      diameter: dimension(34, 'mm', 'estimated', 'Dial comercial parametrico', 0.05),
      thickness: dimension(0.4, 'mm', 'official_complete', MIYOTA_DIAL, 0.04),
      centerHole: dimension(1.7, 'mm', 'official_complete', MIYOTA_DIAL, 0.04),
      seatZ: dimension(6.15, 'mm', 'estimated', 'Derivado del stack editable', 0.1),
      recess: {
        enabled: false,
        depth: dimension(0, 'mm', 'estimated', 'Dial normal por defecto', 0.03),
        radius: dimension(8.2, 'mm', 'estimated', 'Zona parametrica', 0.05),
        transition: 'ramp',
      },
      reliefs: [],
    },
    hands: {
      hour: hand(10, 1.15, 0.12, 0.42, 0.1, 1.2, '#e7a51a'),
      minute: hand(13, 0.82, 0.11, 0.78, 0.12, 0.7, '#f1c928'),
      second: hand(14.5, 0.32, 0.08, 1.22, 0.3, 0.17, '#ef4e58'),
    },
  }
}

export function createMechanicalProject(): WatchProject {
  const project = baseProject('Atelier Mechanical 001')
  project.hands.hour.holeDiameter = dimension(1.5, 'mm', 'estimated', 'Canones del movimiento por disenar', 0.02)
  project.hands.minute.holeDiameter = dimension(0.9, 'mm', 'estimated', 'Canones del movimiento por disenar', 0.02)
  project.hands.second.holeDiameter = dimension(0.25, 'mm', 'estimated', 'Canones del movimiento por disenar', 0.01)
  return { ...project, movement: createMechanicalMovement() }
}

export function createAutomaticMechanicalProject(): WatchProject {
  const project = createMechanicalProject()
  if (project.movement.kind !== 'mechanical') throw new Error('La plantilla mecanica no contiene un movimiento mecanico.')
  project.name = 'Atelier Automatic 001'
  project.movement.architecture = 'automatic'
  project.movement.componentOrigins.rotor = templateOrigin('rotor automatico')
  project.movement.name = 'Movimiento automatico 34 mm'
  project.movement.trainBaseZ = dimension(0.9, 'mm', 'designed', 'Rotor + holgura inferior del tren', 0.03)
  project.movement.bridgeTopZ = dimension(5.65, 'mm', 'designed', 'Plano superior independiente del puente', 0.04)
  project.movement.totalHeight = dimension(5.8, 'mm', 'estimated', 'Puentes + modulo automatico parametrico', 0.12)
  project.movement.stemAxisZ = dimension(2.7, 'mm', 'estimated', 'Eje de remontuar desplazado con el tren', 0.1)
  project.dial.seatZ = dimension(7.15, 'mm', 'designed', 'Fondo + movimiento automatico + separacion de dial', 0.08)
  project.case.stemAxisZ = dimension(3.95, 'mm', 'estimated', 'Alineado al eje del modulo automatico', 0.12)
  return project
}

export function createScratchMechanicalProject(): WatchProject {
  const project = createMechanicalProject()
  if (project.movement.kind !== 'mechanical') throw new Error('No se pudo crear el esqueleto mecanico.')
  project.name = 'Movimiento desde cero'
  project.movement.name = 'Movimiento multicalibre en construccion'
  project.movement.presetId = 'scratch_mechanical'
  project.movement.buildMode = 'scratch'
  project.movement.componentOrigins = {}
  project.notes = 'Proyecto de movimiento desde cero. Las cotas iniciales son una envolvente de trabajo y no representan piezas asignadas.'
  project.presentation.showTechnicalOverlays = true
  return project
}

export function createMiyotaMechanicalStudy(calibre: '8215' | '9015'): WatchProject {
  const reference = miyotaMovement(calibre)
  const sources = miyotaSourceReferences(reference)
  const specification = sources.find((source) => source.id.endsWith('-specification')) ?? sources[0]
  const project = createScratchMechanicalProject()
  if (project.movement.kind !== 'mechanical') throw new Error('No se pudo preparar el estudio mecanico MIYOTA.')

  project.name = `Estudio MIYOTA ${calibre} desde cero`
  project.notes = [
    `Banco vacio referenciado al calibre MIYOTA ${calibre}.`,
    'La envolvente, altura, frecuencia, reserva y angulo de alzado proceden de la ficha oficial.',
    'Ningun componente interno se considera compatible hasta medir sus interfaces o importar y validar su STEP.',
  ].join(' ')
  project.movement.name = `Movimiento multicalibre · referencia MIYOTA ${calibre}`
  project.movement.referenceCalibre = `MIYOTA ${calibre}`
  project.movement.referenceSources = sources
  project.movement.architecture = 'automatic'
  project.movement.componentOrigins = {}

  const official = (value: number, unit: 'mm' | 'h' | 'vph' | 'deg', label: string, tolerance = 0) => ({
    ...dimension(value, unit, 'official_complete', label, tolerance),
    sourceRef: specification,
  })
  if (reference.diameterMm) {
    project.movement.plateDiameter = {
      ...official(reference.diameterMm, 'mm', `Envolvente oficial MIYOTA ${calibre} (no contorno detallado de platina)`, 0.02),
      quality: 'official_partial',
    }
  }
  project.movement.totalHeight = official(reference.heightMm, 'mm', `Altura oficial MIYOTA ${calibre}`, 0.02)
  project.movement.bridgeTopZ = {
    ...dimension(reference.heightMm, 'mm', 'official_partial', `Plano superior limitado por envolvente MIYOTA ${calibre}`, 0.04),
    sourceRef: specification,
  }
  if (reference.runningTimeHours) {
    project.movement.targetPowerReserve = official(reference.runningTimeHours, 'h', `Reserva oficial aproximada MIYOTA ${calibre}`, 1)
    const barrel = project.movement.arbors.find((arbor) => arbor.id === 'barrel')
    const center = project.movement.arbors.find((arbor) => arbor.id === 'center')
    const barrelTeeth = barrel?.wheelTeeth.value ?? 0
    const centerPinionTeeth = center?.pinionTeeth.value ?? 0
    const barrelToCenterRatio = centerPinionTeeth > 0
      ? barrelTeeth / centerPinionTeeth
      : 0
    if (barrelToCenterRatio > 0) {
      const workingTurns = reference.runningTimeHours / barrelToCenterRatio
      project.movement.barrelTurns = dimension(
        workingTurns,
        'count',
        'designed',
        `Ajuste preliminar del barrilete para el objetivo oficial MIYOTA ${calibre}; pendiente de validar con muelle y dentado reales`,
        0.25,
      )
      if (project.movement.mainspring) {
        project.movement.mainspring.turnsWorking = dimension(
          workingTurns,
          'count',
          'designed',
          `Vueltas utiles preliminares para ${reference.runningTimeHours} h; no es una cota oficial MIYOTA`,
          0.25,
        )
      }
    }
  }
  if (reference.frequencyVph) {
    project.movement.escapement.targetVph = official(reference.frequencyVph, 'vph', `Frecuencia oficial MIYOTA ${calibre}`)
  }
  if (reference.liftAngleDeg) {
    project.movement.escapement.liftAngle = official(reference.liftAngleDeg, 'deg', `Angulo de alzado oficial MIYOTA ${calibre}`, 0.5)
  }

  project.case.innerDiameter = dimension(26.4, 'mm', 'designed', `Envolvente MIYOTA ${calibre} + 0,20 mm radiales`, 0.05)
  project.case.outerDiameter = dimension(40, 'mm', 'designed', `Caja de estudio para MIYOTA ${calibre}`, 0.05)
  project.case.totalHeight = dimension(Math.max(9.5, reference.heightMm + 4), 'mm', 'designed', 'Envolvente inicial de caja', 0.1)
  project.case.usableInteriorHeight = dimension(reference.heightMm + 2.2, 'mm', 'designed', 'Movimiento + dial + agujas + holgura', 0.12)
  project.dial.diameter = dimension(30, 'mm', 'designed', `Dial inicial para estudio MIYOTA ${calibre}`, 0.05)
  return project
}

export function createQuartzProject(calibre: 'miyota_2035' | 'miyota_2036'): WatchProject {
  const project = baseProject(calibre === 'miyota_2036' ? 'Miyota 2036 Study' : 'Miyota 2035 Study')
  project.exterior = defaultExteriorSpec(39, 20)
  project.case.outerDiameter = dimension(39, 'mm', 'supplier_partial', 'Watchparts24 case 39 mm', 0.05)
  project.case.innerDiameter = dimension(33.5, 'mm', 'supplier_partial', 'Watchparts24 case listing', 0.1)
  project.case.totalHeight = dimension(9.5, 'mm', 'supplier_partial', 'Watchparts24 case listing', 0.1)
  project.case.usableInteriorHeight = dimension(7.2, 'mm', 'estimated', 'Pendiente de medir bajo cristal', 0.25)
  project.case.dialSeatDiameter = dimension(32.6, 'mm', 'estimated', 'Pendiente de medir asiento', 0.1)
  project.case.crystalSeatDiameter = dimension(34.5, 'mm', 'estimated', 'Pendiente de medir asiento', 0.1)
  project.case.stemAxisZ = dimension(2.8, 'mm', 'estimated', 'Pendiente de medir eje de tija', 0.15)
  project.case.crownDistance = dimension(21.6, 'mm', 'estimated', 'Derivado de caja exterior', 0.2)
  project.dial.diameter = dimension(31.8, 'mm', 'estimated', 'Dial comercial editable', 0.05)
  project.dial.seatZ = dimension(4.55, 'mm', 'estimated', 'Movimiento + asiento estimado', 0.12)
  project.assembly.dialMovementGap = dimension(0.15, 'mm', 'designed', 'Separacion de montaje Miyota', 0.03)
  const dialMate = project.assembly.mates.find((mate) => mate.id === 'mate-dial-movement-z')
  if (dialMate?.offset) dialMate.offset = dimension(0.15, 'mm', 'designed', 'Separacion de montaje Miyota', 0.03)
  project.crystal.type = 'flat'
  project.crystal.diameter = dimension(34.3, 'mm', 'estimated', 'Cristal empaquetado, perfil desconocido', 0.1)
  project.crystal.innerRise = dimension(0, 'mm', 'unknown', 'Perfil interno desconocido', 0.2)
  const movement = createQuartzMovement(calibre)
  project.hands.hour.mountingHeight = movement.handBaseLevels.hour
  project.hands.minute.mountingHeight = movement.handBaseLevels.minute
  project.hands.second.mountingHeight = movement.handBaseLevels.second
  return { ...project, movement }
}

export const PROJECT_TEMPLATES = [
  {
    id: 'scratch-mechanical',
    name: 'Movimiento desde cero',
    description: 'Banco vacio para combinar platina, tren, escape, volante y remontuar de piezas donantes.',
    quality: 'Compatibilidad por interfaces, tolerancias y procedencia',
  },
  {
    id: 'mechanical-34',
    name: 'Mecanico manual 34 mm',
    description: 'Tren 1 h / 60 s, 21.600 vph y reserva objetivo de 52 h.',
    quality: 'Modelo Daniels + hipotesis editables',
  },
  {
    id: 'mechanical-automatic-34',
    name: 'Mecanico automatico 34 mm',
    description: 'Tren mecanico completo, rotor, reversor y escenario de carga diaria.',
    quality: 'Geometria y dinamica parametrica editable',
  },
  {
    id: 'miyota-8215-study',
    name: 'MIYOTA 8215 · desde cero',
    description: 'Banco vacio automatico ligado a ficha, plano, manual y despiece oficiales del calibre 8215.',
    quality: 'Envolvente oficial · interfaces internas pendientes de medir',
  },
  {
    id: 'miyota-9015-study',
    name: 'MIYOTA 9015 · desde cero',
    description: 'Banco vacio premium ligado a ficha, plano, manual y despiece oficiales del calibre 9015.',
    quality: 'Envolvente oficial · interfaces internas pendientes de medir',
  },
  {
    id: 'miyota-2035',
    name: 'Miyota 2035',
    description: 'Cuarzo de tres agujas con stack estandar.',
    quality: 'Planos oficiales + caja proveedor parcial',
  },
  {
    id: 'miyota-2036',
    name: 'Miyota 2036',
    description: 'Cuarzo con stack alto para diales con volumen.',
    quality: 'Planos oficiales + caja proveedor parcial',
  },
] as const

export function projectFromTemplate(id: (typeof PROJECT_TEMPLATES)[number]['id']): WatchProject {
  if (id === 'scratch-mechanical') return createScratchMechanicalProject()
  if (id === 'miyota-8215-study') return createMiyotaMechanicalStudy('8215')
  if (id === 'miyota-9015-study') return createMiyotaMechanicalStudy('9015')
  if (id === 'miyota-2035') return createQuartzProject('miyota_2035')
  if (id === 'miyota-2036') return createQuartzProject('miyota_2036')
  if (id === 'mechanical-automatic-34') return createAutomaticMechanicalProject()
  return createMechanicalProject()
}
