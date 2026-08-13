export type RuntimeEventType =
  | 'package-loaded'
  | 'package-rejected'
  | 'scene-compiled'
  | 'scene-started'
  | 'step-shown'
  | 'step-blocked'
  | 'step-completed'
  | 'selector-resolved'
  | 'entity-selected'
  | 'selection-confirmed'
  | 'command-rejected'
  | 'hint-requested'
  | 'answer-submitted'
  | 'barrier-resolved'
  | 'scene-completed'
  | 'scene-cancelled'
  | 'restoration-completed'
  | 'workbench-command'
  | 'mechanical-lab-command'
  | 'calibre-lab-command'
  | 'runtime-error'

export type RuntimeEventDataValue =
  | string
  | number
  | boolean
  | null
  | RuntimeEventDataValue[]
  | { [key: string]: RuntimeEventDataValue }

export interface RuntimeEvent {
  eventVersion: 1
  sequence: number
  type: RuntimeEventType
  timestamp: string
  sessionId: string
  packageId?: string
  packageVersion?: string
  sceneId?: string
  stepId?: string
  entityIds?: string[]
  commandType?: string
  diagnosticCodes?: string[]
  data?: Record<string, RuntimeEventDataValue>
}

export type RuntimeEventListener = (event: RuntimeEvent) => void

export class RuntimeEventEmitter {
  private sequence = 0
  private readonly events: RuntimeEvent[] = []
  private readonly listeners = new Set<RuntimeEventListener>()
  private readonly sessionId: string
  private readonly now: () => string

  constructor(
    sessionId: string,
    now: () => string = () => new Date().toISOString(),
  ) { this.sessionId = sessionId; this.now = now }

  emit(input: Omit<RuntimeEvent, 'eventVersion' | 'sequence' | 'timestamp' | 'sessionId'>): RuntimeEvent {
    const event: RuntimeEvent = {
      eventVersion: 1,
      sequence: this.sequence,
      timestamp: this.now(),
      sessionId: this.sessionId,
      ...input,
    }
    this.sequence += 1
    this.events.push(event)
    this.listeners.forEach((listener) => listener(event))
    return event
  }

  subscribe(listener: RuntimeEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  history(): RuntimeEvent[] {
    return structuredClone(this.events)
  }
}
