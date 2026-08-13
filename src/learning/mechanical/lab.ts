import {
  MECHANICAL_FAULT_CATALOG,
} from './fixtures'
import {
  AutomaticCalendarLabController,
  BarrelLabController,
  ESCAPEMENT_PHASE_SEQUENCE,
  EscapementLabController,
  GearTrainController,
  KeylessWorksLabController,
  MechanicalEnergyGraph,
  MechanicalFaultLabController,
  MechanicalKinematicGraph,
  MechanicalSystemModel,
  MotionWorksLabController,
  OscillatorLabController,
} from './controllers'
import type {
  GearStage,
  MechanicalCommandResult,
  MechanicalDiagnostic,
  MechanicalLabAccessibilityModel,
  MechanicalLabCommand,
  MechanicalLabEvent,
  MechanicalLabSnapshot,
  MechanicalSubsystem,
  MechanicalViewMode,
} from './model'

const DEFAULT_STAGES: GearStage[] = [
  { id: 'stage.barrel-center', driverTeeth: 80, drivenTeeth: 10, relation: 'external-mesh', engaged: true, centerDistanceState: 'valid-conceptual' },
  { id: 'stage.center-third', driverTeeth: 64, drivenTeeth: 8, relation: 'external-mesh', engaged: true, centerDistanceState: 'valid-conceptual' },
  { id: 'stage.third-fourth', driverTeeth: 60, drivenTeeth: 10, relation: 'external-mesh', engaged: true, centerDistanceState: 'valid-conceptual' },
  { id: 'stage.fourth-escape', driverTeeth: 60, drivenTeeth: 8, relation: 'external-mesh', engaged: true, centerDistanceState: 'valid-conceptual' },
]
const SUBSYSTEMS: MechanicalSubsystem[] = [
  'energy', 'barrel', 'gear-pair', 'train', 'supports', 'escapement',
  'oscillator', 'motion-works', 'keyless', 'automatic', 'calendar', 'integration',
]
const VIEW_MODES: MechanicalViewMode[] = [
  'normal', 'schematic', 'section', 'exploded', 'isolated', 'slow-motion',
  'step-by-step', 'energy-flow', 'kinematics', 'provenance', 'uncertainty',
  'compare-8215', 'textual',
]

export class MechanicalLearningLab {
  readonly fixtureId = 'fixture.conceptual.mechanical-chain' as const
  readonly comparisonFixtureId = 'fixture.miyota.8215.structural' as const
  readonly systemModel = new MechanicalSystemModel()
  readonly kinematicGraphModel = new MechanicalKinematicGraph()
  readonly energyGraphModel = new MechanicalEnergyGraph()
  readonly gearTrainController = new GearTrainController()
  readonly barrelLab = new BarrelLabController()
  readonly escapementLab = new EscapementLabController()
  readonly oscillatorLab = new OscillatorLabController()
  readonly motionWorksLab = new MotionWorksLabController()
  readonly keylessWorksLab = new KeylessWorksLabController()
  readonly automaticCalendarLab = new AutomaticCalendarLabController()
  readonly faultLab = new MechanicalFaultLabController()
  readonly entities = this.systemModel.entities
  readonly kinematicRelations = this.kinematicGraphModel.relations
  readonly energyGraph = this.energyGraphModel.segments
  private state: MechanicalLabSnapshot
  private history: MechanicalLabSnapshot[] = []
  private readonly now: () => string

  constructor(reducedMotion = false, now: () => string = () => new Date().toISOString()) {
    this.now = now
    this.state = {
      schemaVersion: 1,
      fixtureId: this.fixtureId,
      comparisonFixtureId: this.comparisonFixtureId,
      selectedSubsystem: 'energy',
      viewMode: reducedMotion ? 'step-by-step' : 'normal',
      energyLevel: 0,
      energyReleased: false,
      blockedEntityIds: [],
      gearStages: structuredClone(DEFAULT_STAGES),
      supportState: 'supported',
      escapementPhase: 'locked-left',
      escapementPaused: true,
      escapementSpeed: 1,
      oscillatorFrequencyHz: 2.5,
      oscillatorAmplitudeDegrees: 180,
      oscillatorPaused: true,
      hairspringActiveLength: 1,
      motionWorksEngaged: true,
      indicatedMinutes: 0,
      crownPosition: 'neutral',
      automaticEnabled: false,
      automaticReversal: 'bidirectional',
      calendarDay: 1,
      calendarBlocked: false,
      faults: structuredClone(MECHANICAL_FAULT_CATALOG),
      events: [],
      nextSequence: 0,
      reducedMotion,
      projectDraft: {
        enabledSubsystems: ['energy'],
        decisions: [],
        passedChecks: [],
        pendingChecks: ['comparación visual 8215 R2', 'revisión humana del dossier'],
      },
      createdAt: this.now(),
    }
  }

  snapshot(): MechanicalLabSnapshot { return structuredClone(this.state) }
  serialize(): string { return JSON.stringify(this.state) }
  events(): MechanicalLabEvent[] { return structuredClone(this.state.events) }
  totalGearRatio(): ReturnType<MechanicalKinematicGraph['calculate']> {
    return this.kinematicGraphModel.calculate(this.state.gearStages)
  }
  currentEnergyGraph(): ReturnType<MechanicalEnergyGraph['current']> {
    return this.energyGraphModel.current(this.state)
  }

  accessibilityModel(): MechanicalLabAccessibilityModel {
    return {
      orderedSubsystems: [...SUBSYSTEMS],
      commands: [
        ['wind', 'Cargar energía', 'Alt+C'],
        ['release', 'Liberar energía', 'Alt+L'],
        ['block', 'Bloquear elemento', 'Alt+B'],
        ['unblock', 'Desbloquear elemento', 'Alt+D'],
        ['change-ratio', 'Cambiar relación', 'Alt+R'],
        ['step-escapement', 'Avanzar escape', 'Alt+E'],
        ['scrub-escapement', 'Elegir fase del escape', 'Alt+S'],
        ['set-oscillator', 'Configurar oscilador', 'Alt+O'],
        ['change-crown-position', 'Cambiar corona', 'Alt+T'],
        ['advance-calendar', 'Avanzar calendario', 'Alt+A'],
        ['introduce-fault', 'Introducir fallo', 'Alt+F'],
        ['undo', 'Deshacer', 'Ctrl+Z'],
      ].map(([type, label, keyboardShortcut]) => ({
        type: type as MechanicalLabCommand['type'],
        label,
        keyboardShortcut,
        requiresDrag: false as const,
      })),
      textualRelations: this.kinematicGraphModel.textualAlternative(),
      textualEnergyGraph: this.energyGraphModel.textualAlternative(this.currentEnergyGraph()),
      staticEscapementPhases: ESCAPEMENT_PHASE_SEQUENCE.map((phase, index) => ({
        index: index + 1,
        phase,
        description: `${index + 1}. ${phase.replaceAll('-', ' ')}.`,
      })),
      reducedMotion: { discreteStates: true, sameResults: true, automaticMotion: false },
    }
  }

  restore(snapshot: MechanicalLabSnapshot): void {
    if (
      snapshot.schemaVersion !== 1
      || snapshot.fixtureId !== this.fixtureId
      || snapshot.comparisonFixtureId !== this.comparisonFixtureId
    ) throw new Error('El snapshot no pertenece al laboratorio mecánico compatible.')
    this.state = structuredClone(snapshot)
  }

  async dispatch(command: MechanicalLabCommand): Promise<MechanicalCommandResult> {
    const diagnostics = this.validate(command)
    if (diagnostics.some(({ blocking }) => blocking)) return this.result(command, false, diagnostics)
    if (command.type !== 'restore' && command.type !== 'undo') this.history.push(this.snapshot())
    switch (command.type) {
      case 'select-subsystem': this.state.selectedSubsystem = command.subsystem; break
      case 'change-view': this.state.viewMode = command.view; break
      case 'wind':
        this.barrelLab.wind(this.state, command.amount)
        break
      case 'release':
        this.barrelLab.release(this.state, command.amount)
        break
      case 'block':
        if (!this.state.blockedEntityIds.includes(command.entityId)) this.state.blockedEntityIds.push(command.entityId)
        break
      case 'unblock':
        this.state.blockedEntityIds = this.state.blockedEntityIds.filter((id) => id !== command.entityId)
        break
      case 'engage':
      case 'disengage': {
        const engaged = command.type === 'engage'
        if (command.target === 'motion-works') this.motionWorksLab.setEngaged(this.state, engaged)
        else this.gearTrainController.setEngaged(this.state, command.stageId!, engaged)
        break
      }
      case 'rotate':
        if (this.state.motionWorksEngaged && command.entityId.includes('crown')) {
          this.motionWorksLab.rotateCrown(this.state, command.turns)
        }
        break
      case 'oscillate':
        this.oscillatorLab.oscillate(this.state)
        this.escapementLab.step(this.state, command.cycles * 2)
        break
      case 'change-ratio':
        this.gearTrainController.changeRatio(this.state, command.stageId, command.driverTeeth, command.drivenTeeth)
        break
      case 'add-stage': this.gearTrainController.add(this.state, command.stage); break
      case 'remove-stage': this.gearTrainController.remove(this.state, command.stageId); break
      case 'align': this.state.supportState = command.state; break
      case 'misalign': this.state.supportState = command.state; break
      case 'set-time': this.motionWorksLab.setTime(this.state, command.minutes); break
      case 'change-crown-position': this.keylessWorksLab.transition(this.state, command.position); break
      case 'set-oscillator':
        this.oscillatorLab.configure(this.state, command.frequencyHz, command.amplitudeDegrees)
        break
      case 'step-escapement': this.escapementLab.step(this.state, command.direction ?? 1); break
      case 'scrub-escapement': this.escapementLab.scrub(this.state, command.phaseIndex); break
      case 'set-escapement-speed': this.escapementLab.setSpeed(this.state, command.multiplier); break
      case 'pause-escapement': this.escapementLab.pause(this.state, command.paused); break
      case 'pause-oscillator': this.oscillatorLab.pause(this.state, command.paused); break
      case 'set-hairspring-active-length': this.oscillatorLab.setActiveLength(this.state, command.normalizedLength); break
      case 'enable-automatic':
        this.automaticCalendarLab.enableAutomatic(this.state, command.reversal)
        break
      case 'disable-automatic': this.automaticCalendarLab.disableAutomatic(this.state); break
      case 'advance-calendar': this.automaticCalendarLab.advanceCalendar(this.state, command.days); break
      case 'introduce-fault':
        this.faultLab.introduce(this.state, command.fault)
        break
      case 'inspect': break
      case 'project-enable-subsystem':
        if (!this.state.projectDraft.enabledSubsystems.includes(command.subsystem)) this.state.projectDraft.enabledSubsystems.push(command.subsystem)
        break
      case 'project-record-decision': this.state.projectDraft.decisions.push(command.decision); break
      case 'restore': this.restore(command.snapshot); break
      case 'undo': {
        const previous = this.history.pop()
        if (previous) this.restore(previous)
        break
      }
    }
    this.refreshProjectChecks()
    return this.result(command, true, [])
  }

  private validate(command: MechanicalLabCommand): MechanicalDiagnostic[] {
    if (command.type === 'select-subsystem' && !SUBSYSTEMS.includes(command.subsystem)) {
      return [{ code: 'ML-UNKNOWN-SUBSYSTEM', message: 'El subsistema no pertenece al laboratorio.', blocking: true }]
    }
    if (command.type === 'change-view' && !VIEW_MODES.includes(command.view)) {
      return [{ code: 'ML-UNKNOWN-VIEW', message: 'El modo de vista no está declarado.', blocking: true }]
    }
    if (command.type === 'wind' || command.type === 'release') {
      if (!Number.isFinite(command.amount) || command.amount <= 0 || command.amount > 1) {
        return [{ code: 'ML-ENERGY-RANGE', message: 'La variación normalizada debe estar entre 0 y 1.', blocking: true }]
      }
    }
    if (command.type === 'release' && this.state.energyLevel === 0) {
      return [{ code: 'ML-NO-ENERGY', message: 'No hay energía normalizada que liberar.', blocking: true }]
    }
    if (command.type === 'block' || command.type === 'unblock' || command.type === 'inspect' || command.type === 'rotate') {
      if (!this.entities.some(({ id }) => id === command.entityId)) {
        return [{ code: 'ML-UNKNOWN-ENTITY', message: `Entidad mecánica inexistente: ${command.entityId}.`, blocking: true }]
      }
    }
    if (command.type === 'change-ratio') {
      if (!this.state.gearStages.some(({ id }) => id === command.stageId)) {
        return [{ code: 'ML-UNKNOWN-STAGE', message: 'La etapa no existe.', blocking: true }]
      }
      if (![command.driverTeeth, command.drivenTeeth].every((value) => Number.isInteger(value) && value > 0 && value <= 500)) {
        return [{ code: 'ML-INVALID-TEETH', message: 'Los dientes deben ser enteros positivos menores o iguales que 500.', blocking: true }]
      }
    }
    if ((command.type === 'engage' || command.type === 'disengage') && command.target === 'gear-stage') {
      if (!command.stageId || !this.state.gearStages.some(({ id }) => id === command.stageId)) {
        return [{ code: 'ML-UNKNOWN-STAGE', message: 'Selecciona una etapa válida.', blocking: true }]
      }
    }
    if (command.type === 'add-stage') {
      if (this.state.gearStages.some(({ id }) => id === command.stage.id)) {
        return [{ code: 'ML-DUPLICATE-STAGE', message: 'La etapa debe tener identidad única.', blocking: true }]
      }
      if (command.stage.driverTeeth <= 0 || command.stage.drivenTeeth <= 0) {
        return [{ code: 'ML-INVALID-TEETH', message: 'La etapa necesita conteos positivos.', blocking: true }]
      }
      if (
        ![command.stage.driverTeeth, command.stage.drivenTeeth].every((value) => Number.isInteger(value) && value <= 500)
        || !['external-mesh', 'internal-mesh'].includes(command.stage.relation)
        || !['valid-conceptual', 'too-far', 'overlapping'].includes(command.stage.centerDistanceState)
      ) {
        return [{ code: 'ML-INVALID-STAGE', message: 'La etapa contiene dientes, relación o centros no válidos.', blocking: true }]
      }
    }
    if (command.type === 'remove-stage' && !this.state.gearStages.some(({ id }) => id === command.stageId)) {
      return [{ code: 'ML-UNKNOWN-STAGE', message: 'La etapa no existe.', blocking: true }]
    }
    if (command.type === 'set-oscillator') {
      if (command.frequencyHz <= 0 || command.frequencyHz > 20) {
        return [{ code: 'ML-FREQUENCY-RANGE', message: 'La frecuencia conceptual debe estar entre 0 y 20 Hz.', blocking: true }]
      }
      if (command.amplitudeDegrees < 0 || command.amplitudeDegrees > 360) {
        return [{ code: 'ML-AMPLITUDE-RANGE', message: 'La amplitud conceptual debe estar entre 0 y 360°.', blocking: true }]
      }
    }
    if (command.type === 'rotate' && (!Number.isFinite(command.turns) || Math.abs(command.turns) > 1_000)) {
      return [{ code: 'ML-ROTATION-RANGE', message: 'Las vueltas deben ser finitas y estar dentro del rango educativo.', blocking: true }]
    }
    if (command.type === 'oscillate' && (!Number.isInteger(command.cycles) || command.cycles <= 0 || command.cycles > 1_000)) {
      return [{ code: 'ML-OSCILLATION-RANGE', message: 'Los ciclos deben ser un entero entre 1 y 1000.', blocking: true }]
    }
    if (command.type === 'set-time' && !Number.isFinite(command.minutes)) {
      return [{ code: 'ML-TIME-RANGE', message: 'El tiempo conceptual debe ser finito.', blocking: true }]
    }
    if (command.type === 'change-crown-position' && !['winding', 'neutral', 'time-setting'].includes(command.position)) {
      return [{ code: 'ML-CROWN-POSITION', message: 'La posición de corona no pertenece al modelo conceptual.', blocking: true }]
    }
    if (command.type === 'align' && command.state !== 'supported') {
      return [{ code: 'ML-SUPPORT-STATE', message: 'Alinear restaura el apoyo al estado supported.', blocking: true }]
    }
    if (command.type === 'misalign' && !['pivot-outside-jewel', 'excess-axial', 'no-freedom', 'rubbing'].includes(command.state)) {
      return [{ code: 'ML-SUPPORT-STATE', message: 'El estado de apoyo incorrecto no está declarado.', blocking: true }]
    }
    if (command.type === 'step-escapement' && command.direction !== undefined && ![1, -1].includes(command.direction)) {
      return [{ code: 'ML-ESCAPEMENT-DIRECTION', message: 'El paso del escape solo admite avance o retroceso.', blocking: true }]
    }
    if (command.type === 'scrub-escapement' && (!Number.isInteger(command.phaseIndex) || command.phaseIndex < 0 || command.phaseIndex >= ESCAPEMENT_PHASE_SEQUENCE.length)) {
      return [{ code: 'ML-ESCAPEMENT-PHASE', message: 'La fase del escape debe estar entre 0 y 7.', blocking: true }]
    }
    if (command.type === 'set-escapement-speed' && (![0.25, 0.5, 1].includes(command.multiplier))) {
      return [{ code: 'ML-ESCAPEMENT-SPEED', message: 'La velocidad visual admite 0,25×, 0,5× o 1×.', blocking: true }]
    }
    if (command.type === 'pause-escapement' && typeof command.paused !== 'boolean') {
      return [{ code: 'ML-ESCAPEMENT-PAUSE', message: 'La pausa debe ser un estado booleano.', blocking: true }]
    }
    if (command.type === 'pause-oscillator' && typeof command.paused !== 'boolean') {
      return [{ code: 'ML-OSCILLATOR-PAUSE', message: 'La pausa del oscilador debe ser booleana.', blocking: true }]
    }
    if (command.type === 'set-hairspring-active-length' && (
      !Number.isFinite(command.normalizedLength)
      || command.normalizedLength < 0.25
      || command.normalizedLength > 1.5
    )) {
      return [{ code: 'ML-HAIRSPRING-LENGTH', message: 'La longitud activa normalizada debe estar entre 0,25 y 1,5.', blocking: true }]
    }
    if (command.type === 'enable-automatic' && !['unidirectional', 'bidirectional'].includes(command.reversal)) {
      return [{ code: 'ML-AUTOMATIC-REVERSAL', message: 'La familia de reversión no está declarada.', blocking: true }]
    }
    if (command.type === 'advance-calendar' && this.state.calendarBlocked) {
      return [{ code: 'ML-CALENDAR-BLOCKED', message: 'El calendario conceptual está bloqueado; diagnostica o restaura antes de avanzar.', blocking: true }]
    }
    if (command.type === 'advance-calendar' && (!Number.isInteger(command.days) || command.days === 0 || Math.abs(command.days) > 365)) {
      return [{ code: 'ML-CALENDAR-RANGE', message: 'El avance debe ser un número entero de días dentro del rango educativo.', blocking: true }]
    }
    if (command.type === 'introduce-fault' && !MECHANICAL_FAULT_CATALOG.some(({ kind }) => kind === command.fault)) {
      return [{ code: 'ML-UNKNOWN-FAULT', message: 'El fallo no pertenece al catálogo conceptual.', blocking: true }]
    }
    if (command.type === 'project-enable-subsystem' && !SUBSYSTEMS.includes(command.subsystem)) {
      return [{ code: 'ML-UNKNOWN-SUBSYSTEM', message: 'El subsistema del proyecto no está declarado.', blocking: true }]
    }
    if (command.type === 'project-record-decision' && (command.decision.trim().length === 0 || command.decision.length > 1_000)) {
      return [{ code: 'ML-PROJECT-DECISION', message: 'La decisión debe contener entre 1 y 1000 caracteres.', blocking: true }]
    }
    if (command.type === 'restore' && (
      !command.snapshot
      || command.snapshot.schemaVersion !== 1
      || command.snapshot.fixtureId !== this.fixtureId
      || command.snapshot.comparisonFixtureId !== this.comparisonFixtureId
    )) {
      return [{ code: 'ML-INCOMPATIBLE-SNAPSHOT', message: 'El snapshot no pertenece a este laboratorio.', blocking: true }]
    }
    if (command.type === 'undo' && this.history.length === 0) {
      return [{ code: 'ML-NOTHING-TO-UNDO', message: 'No hay un estado anterior en esta sesión.', blocking: true }]
    }
    return []
  }

  private refreshProjectChecks(): void {
    const passed: string[] = []
    const requiredSubsystems: MechanicalSubsystem[] = [
      'barrel', 'train', 'escapement', 'oscillator', 'motion-works', 'keyless',
    ]
    if (this.state.energyLevel > 0) passed.push('energía configurada')
    if (this.totalGearRatio().totalRatio.value > 0) passed.push('tren conectado')
    if (!this.state.blockedEntityIds.includes('mechanical.escape-wheel')) passed.push('escape no bloqueado')
    if (this.state.oscillatorFrequencyHz > 0 && this.state.oscillatorAmplitudeDegrees > 0) passed.push('oscilador configurado')
    if (this.state.motionWorksEngaged) passed.push('minutería conectada')
    if (requiredSubsystems.every((subsystem) => this.state.projectDraft.enabledSubsystems.includes(subsystem))) {
      passed.push('arquitectura mínima documentada')
    }
    if (this.state.viewMode === 'compare-8215') passed.push('comparación visual 8215 R2')
    if (this.state.projectDraft.decisions.length > 0) passed.push('decisiones y límites documentados')
    this.state.projectDraft.passedChecks = passed
    this.state.projectDraft.pendingChecks = [
      ...(requiredSubsystems.every((subsystem) => this.state.projectDraft.enabledSubsystems.includes(subsystem))
        ? []
        : ['arquitectura mínima incompleta']),
      ...(this.state.viewMode === 'compare-8215' ? [] : ['comparación visual 8215 R2']),
      ...(this.state.projectDraft.decisions.length > 0 ? [] : ['decisiones y límites']),
      'revisión humana del dossier',
    ]
  }

  private result(command: MechanicalLabCommand, accepted: boolean, diagnostics: MechanicalDiagnostic[]): MechanicalCommandResult {
    const event: MechanicalLabEvent = {
      sequence: this.state.nextSequence,
      timestamp: this.now(),
      commandId: command.id,
      commandType: command.type,
      accepted,
      diagnosticCodes: diagnostics.map(({ code }) => code),
      evidence: {
        accepted,
        subsystem: this.state.selectedSubsystem,
        viewMode: this.state.viewMode,
        energyLevel: this.state.energyLevel,
        gearRatio: this.totalGearRatio().totalRatio.value,
        escapementPhase: this.state.escapementPhase,
        frequencyHz: this.state.oscillatorFrequencyHz,
        amplitudeDegrees: this.state.oscillatorAmplitudeDegrees,
        crownPosition: this.state.crownPosition,
        calendarDay: this.state.calendarDay,
        activeFaults: this.state.faults.filter(({ active }) => active).map(({ kind }) => kind),
        fidelity: 'G1/K2/P0 conceptual; comparación 8215 R2 separada',
      },
    }
    this.state.nextSequence += 1
    this.state.events.push(event)
    return { accepted, event: structuredClone(event), diagnostics: structuredClone(diagnostics) }
  }
}

export function restoreMechanicalLearningLab(serialized: string, now?: () => string): MechanicalLearningLab {
  const snapshot = JSON.parse(serialized) as MechanicalLabSnapshot
  const lab = new MechanicalLearningLab(snapshot.reducedMotion, now)
  lab.restore(snapshot)
  return lab
}
