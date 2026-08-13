import type { LearningRuntimeState } from './runtime'
import { diagnostic, type RuntimeDiagnostic } from './diagnostics'
import type { RuntimeEventEmitter } from './events'

export type LearningCommand =
  | { type: 'start-scene' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'restart' }
  | { type: 'select-entity'; entityId: string }
  | { type: 'confirm-selection' }
  | { type: 'show-hint'; hintId?: string }
  | { type: 'next-step' }
  | { type: 'previous-step' }
  | { type: 'jump-step'; stepId: string }
  | { type: 'scrub'; timeMs: number }
  | { type: 'set-speed'; speed: number }
  | { type: 'answer'; questionId: string; answer: unknown }
  | { type: 'isolate-subsystem'; subsystem: string }
  | { type: 'restore-view' }
  | { type: 'cancel'; reason: string }
  | { type: 'abort'; reason: string }

export interface CommandExecutionResult {
  accepted: boolean
  diagnostics: RuntimeDiagnostic[]
}

export interface LearningCommandTarget {
  state(): LearningRuntimeState
  executeCommand(command: LearningCommand): Promise<void>
}

const ALLOWED_STATES: Record<LearningCommand['type'], LearningRuntimeState[]> = {
  'start-scene': ['ready'],
  pause: ['running'],
  resume: ['paused'],
  stop: ['running', 'paused', 'awaiting-interaction'],
  restart: ['running', 'paused', 'awaiting-interaction', 'completed', 'failed'],
  'select-entity': ['running', 'paused', 'awaiting-interaction'],
  'confirm-selection': ['awaiting-interaction', 'paused', 'running'],
  'show-hint': ['running', 'paused', 'awaiting-interaction'],
  'next-step': ['running', 'paused', 'awaiting-interaction'],
  'previous-step': ['running', 'paused', 'awaiting-interaction'],
  'jump-step': ['running', 'paused', 'awaiting-interaction'],
  scrub: ['running', 'paused', 'awaiting-interaction'],
  'set-speed': ['ready', 'running', 'paused', 'awaiting-interaction'],
  answer: ['running', 'paused', 'awaiting-interaction'],
  'isolate-subsystem': ['running', 'paused', 'awaiting-interaction'],
  'restore-view': ['running', 'paused', 'awaiting-interaction', 'completed', 'failed'],
  cancel: ['ready', 'running', 'paused', 'awaiting-interaction', 'completed', 'failed'],
  abort: ['loading', 'validating', 'compiling', 'ready', 'running', 'paused', 'awaiting-interaction', 'failed'],
}

export class LearningCommandBus {
  private cancelled = false
  private readonly target: LearningCommandTarget
  private readonly events: RuntimeEventEmitter

  constructor(
    target: LearningCommandTarget,
    events: RuntimeEventEmitter,
  ) { this.target = target; this.events = events }

  async dispatch(command: LearningCommand): Promise<CommandExecutionResult> {
    if (this.cancelled && command.type !== 'restore-view') return this.reject(command, 'El command bus está cancelado.')
    const state = this.target.state()
    if (!ALLOWED_STATES[command.type].includes(state)) return this.reject(command, `El comando ${command.type} no está permitido en ${state}.`)
    try {
      await this.target.executeCommand(command)
      if (command.type === 'cancel' || command.type === 'abort') this.cancelled = true
      return { accepted: true, diagnostics: [] }
    } catch (error) {
      return this.reject(command, error instanceof Error ? error.message : String(error))
    }
  }

  resetCancellation(): void {
    this.cancelled = false
  }

  private reject(command: LearningCommand, message: string): CommandExecutionResult {
    const issue = diagnostic({
      code: 'LR-COMMAND-REJECTED', category: 'invalid-state', message, technicalDetail: JSON.stringify({ type: command.type }),
      source: 'command-bus', suggestedRecovery: 'Consultar los comandos permitidos para el estado actual.', blocking: false, retrySafe: true,
    })
    this.events.emit({ type: 'command-rejected', commandType: command.type, diagnosticCodes: [issue.code] })
    return { accepted: false, diagnostics: [issue] }
  }
}
