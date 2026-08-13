import { calculateGearTrain } from './calculations'
import {
  MECHANICAL_ENERGY_SEGMENTS,
  MECHANICAL_KINEMATIC_RELATIONS,
  MECHANICAL_LAB_ENTITIES,
} from './fixtures'
import type {
  CrownPosition,
  EnergySegment,
  EscapementPhase,
  GearStage,
  MechanicalEntity,
  MechanicalFault,
  MechanicalLabSnapshot,
  MechanicalRelationType,
} from './model'

export const ESCAPEMENT_PHASE_SEQUENCE: EscapementPhase[] = [
  'locked-left',
  'unlock-left',
  'impulse-left',
  'drop-left',
  'locked-right',
  'unlock-right',
  'impulse-right',
  'drop-right',
]

/** Immutable structural view shared by every subsystem controller. */
export class MechanicalSystemModel {
  readonly entities: MechanicalEntity[] = structuredClone(MECHANICAL_LAB_ENTITIES)

  entity(id: string): MechanicalEntity | undefined {
    const match = this.entities.find((candidate) => candidate.id === id)
    return match ? structuredClone(match) : undefined
  }
}

/** Declarative graph; it computes ideal kinematics but owns no UI or session state. */
export class MechanicalKinematicGraph {
  readonly relations = structuredClone(MECHANICAL_KINEMATIC_RELATIONS)

  calculate(stages: GearStage[]): ReturnType<typeof calculateGearTrain> {
    return calculateGearTrain(stages.map((stage) => ({
      driverTeeth: stage.driverTeeth,
      drivenTeeth: stage.drivenTeeth,
      relation: stage.relation,
      engaged: stage.engaged && stage.centerDistanceState === 'valid-conceptual',
    })))
  }

  relationsOfType(type: MechanicalRelationType) {
    return structuredClone(this.relations.filter((relation) => relation.type === type))
  }

  textualAlternative(): string[] {
    return this.relations.map(({ driverId, drivenId, type, ratio, direction }) =>
      `${driverId} ${type} ${drivenId}; relación ${ratio}; dirección ${direction === -1 ? 'opuesta' : 'igual'}.`)
  }
}

/** Energy and textual representations are derived from the same source graph. */
export class MechanicalEnergyGraph {
  readonly segments = structuredClone(MECHANICAL_ENERGY_SEGMENTS)

  current(state: MechanicalLabSnapshot) {
    return this.segments.map((segment) => {
      let segmentState: EnergySegment['state']
      const blocked = state.blockedEntityIds.includes(segment.fromId) || state.blockedEntityIds.includes(segment.toId)
      if (blocked) segmentState = 'blocked'
      else if (segment.branch === 'automatic') segmentState = state.automaticEnabled ? 'active' : 'inactive'
      else if (segment.branch === 'calendar') segmentState = state.calendarBlocked ? 'blocked' : 'active'
      else if (segment.branch === 'motion-works') segmentState = state.motionWorksEngaged ? 'active' : 'interrupted'
      else if (segment.branch === 'setting') segmentState = state.crownPosition === 'time-setting' ? 'active' : 'inactive'
      else if (state.gearStages.some(({ engaged, centerDistanceState }) => !engaged || centerDistanceState !== 'valid-conceptual')) {
        segmentState = segment.id === 'spring-barrel' ? 'active' : 'interrupted'
      } else segmentState = state.energyLevel > 0 && state.energyReleased ? 'active' : 'inactive'
      return { ...segment, state: segmentState }
    })
  }

  textualAlternative(segments = this.segments): string[] {
    return segments.map(({ fromId, toId, function: role, branch, direction, state }) =>
      `${fromId} → ${toId}; función ${role}; rama ${branch}; dirección ${direction}; estado ${state}.`)
  }
}

export class GearTrainController {
  changeRatio(state: MechanicalLabSnapshot, stageId: string, driverTeeth: number, drivenTeeth: number): void {
    const stage = this.requiredStage(state, stageId)
    stage.driverTeeth = driverTeeth
    stage.drivenTeeth = drivenTeeth
  }

  add(state: MechanicalLabSnapshot, stage: GearStage): void {
    state.gearStages.push(structuredClone(stage))
  }

  remove(state: MechanicalLabSnapshot, stageId: string): void {
    state.gearStages = state.gearStages.filter(({ id }) => id !== stageId)
  }

  setEngaged(state: MechanicalLabSnapshot, stageId: string, engaged: boolean): void {
    this.requiredStage(state, stageId).engaged = engaged
  }

  private requiredStage(state: MechanicalLabSnapshot, stageId: string): GearStage {
    const stage = state.gearStages.find(({ id }) => id === stageId)
    if (!stage) throw new Error(`Etapa inexistente: ${stageId}`)
    return stage
  }
}

export class BarrelLabController {
  wind(state: MechanicalLabSnapshot, amount: number): void {
    state.energyLevel = Math.min(1, state.energyLevel + amount)
    state.energyReleased = false
  }

  release(state: MechanicalLabSnapshot, amount: number): void {
    state.energyLevel = Math.max(0, state.energyLevel - amount)
    state.energyReleased = true
  }
}

export class EscapementLabController {
  step(state: MechanicalLabSnapshot, delta: number): void {
    const current = ESCAPEMENT_PHASE_SEQUENCE.indexOf(state.escapementPhase)
    const next = ((current + delta) % ESCAPEMENT_PHASE_SEQUENCE.length + ESCAPEMENT_PHASE_SEQUENCE.length)
      % ESCAPEMENT_PHASE_SEQUENCE.length
    state.escapementPhase = ESCAPEMENT_PHASE_SEQUENCE[next]
  }

  pause(state: MechanicalLabSnapshot, paused: boolean): void {
    state.escapementPaused = paused
  }

  scrub(state: MechanicalLabSnapshot, phaseIndex: number): void {
    state.escapementPhase = ESCAPEMENT_PHASE_SEQUENCE[phaseIndex]
  }

  setSpeed(state: MechanicalLabSnapshot, multiplier: number): void {
    state.escapementSpeed = multiplier
  }
}

export class OscillatorLabController {
  configure(state: MechanicalLabSnapshot, frequencyHz: number, amplitudeDegrees: number): void {
    state.oscillatorFrequencyHz = frequencyHz
    state.oscillatorAmplitudeDegrees = amplitudeDegrees
  }

  oscillate(state: MechanicalLabSnapshot): void {
    state.oscillatorPaused = false
    state.escapementPaused = false
  }

  pause(state: MechanicalLabSnapshot, paused: boolean): void {
    state.oscillatorPaused = paused
  }

  setActiveLength(state: MechanicalLabSnapshot, normalizedLength: number): void {
    state.hairspringActiveLength = normalizedLength
  }
}

export class MotionWorksLabController {
  setTime(state: MechanicalLabSnapshot, minutes: number): void {
    state.indicatedMinutes = ((minutes % 720) + 720) % 720
  }

  rotateCrown(state: MechanicalLabSnapshot, turns: number): void {
    if (state.motionWorksEngaged) state.indicatedMinutes = (state.indicatedMinutes + turns * 60 + 720) % 720
  }

  setEngaged(state: MechanicalLabSnapshot, engaged: boolean): void {
    state.motionWorksEngaged = engaged
  }
}

export class KeylessWorksLabController {
  transition(state: MechanicalLabSnapshot, position: CrownPosition): void {
    state.crownPosition = position
  }
}

export class AutomaticCalendarLabController {
  enableAutomatic(state: MechanicalLabSnapshot, reversal: 'unidirectional' | 'bidirectional'): void {
    state.automaticEnabled = true
    state.automaticReversal = reversal
  }

  disableAutomatic(state: MechanicalLabSnapshot): void {
    state.automaticEnabled = false
  }

  advanceCalendar(state: MechanicalLabSnapshot, days: number): void {
    if (!state.calendarBlocked) state.calendarDay = ((state.calendarDay - 1 + days) % 31 + 31) % 31 + 1
  }
}

export class MechanicalFaultLabController {
  introduce(state: MechanicalLabSnapshot, kind: MechanicalFault['kind']): void {
    state.faults = state.faults.map((fault) => fault.kind === kind ? { ...fault, active: true } : fault)
    if (kind === 'mainspring-discharged') state.energyLevel = 0
    if (kind === 'barrel-blocked') this.blockOnce(state, 'mechanical.barrel-drum')
    if (kind === 'missing-mesh') state.gearStages[0].engaged = false
    if (kind === 'incorrect-ratio') state.gearStages[0].drivenTeeth += 7
    if (kind === 'pivot-outside-jewel') state.supportState = 'pivot-outside-jewel'
    if (kind === 'wheel-no-freedom') state.supportState = 'no-freedom'
    if (kind === 'escapement-blocked') this.blockOnce(state, 'mechanical.escape-wheel')
    if (kind === 'pallet-no-alternation') this.blockOnce(state, 'mechanical.pallet-fork')
    if (kind === 'balance-blocked') this.blockOnce(state, 'mechanical.balance')
    if (kind === 'low-amplitude-conceptual') state.oscillatorAmplitudeDegrees = 40
    if (kind === 'hairspring-rubbing') state.hairspringActiveLength = 0.6
    if (kind === 'motion-works-disconnected' || kind === 'hands-rubbing') state.motionWorksEngaged = false
    if (kind === 'wrong-crown-position') state.crownPosition = 'neutral'
    if (kind === 'automatic-disconnected') state.automaticEnabled = false
    if (kind === 'calendar-blocked') state.calendarBlocked = true
  }

  private blockOnce(state: MechanicalLabSnapshot, entityId: string): void {
    if (!state.blockedEntityIds.includes(entityId)) state.blockedEntityIds.push(entityId)
  }
}
