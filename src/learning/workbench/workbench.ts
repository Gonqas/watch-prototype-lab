import type { TechnicalMovementFixture } from '../technical/reconstruction'
import { WorkbenchDependencyGraph } from './dependencies'
import {
  createWorkbenchDependencies,
  createWorkbenchParts,
  createWorkbenchTools,
  createWorkbenchZones,
} from './fixture2035'
import type {
  HandlingCommand,
  PracticeMode,
  ToolCapability,
  TrayZone,
  WorkbenchAccessibilityModel,
  WorkbenchCommandResult,
  WorkbenchDiagnostic,
  WorkbenchEvent,
  WorkbenchObservation,
  WorkbenchPart,
  WorkbenchSnapshot,
  WorkbenchTool,
  WorkbenchZone,
} from './model'

const DEFAULT_TRAY_ZONES: TrayZone[] = Array.from({ length: 8 }, (_, index) => ({
  id: `tray.zone.${index + 1}`,
  label: `Zona ${index + 1}`,
  order: index + 1,
  instanceIds: [],
}))

function capabilityForPart(part: WorkbenchPart, operation: 'remove' | 'place' | 'align' | 'install'): ToolCapability {
  if (part.fastener) return operation === 'install' ? 'tighten-fastener' : operation === 'remove' ? 'loosen-fastener' : 'place-part'
  if (part.subsystem === 'indication') return operation === 'install' ? 'install-hands' : operation === 'remove' ? 'remove-hands' : 'place-part'
  return operation === 'align' ? 'rotate-part' : operation === 'place' || operation === 'install' ? 'place-part' : 'pick-part'
}

export class VirtualWorkbench {
  readonly fixtureId: string
  readonly fixtureVersion: string
  readonly zones: WorkbenchZone[]
  readonly tools: WorkbenchTool[]
  readonly disassembly: WorkbenchDependencyGraph
  readonly assembly: WorkbenchDependencyGraph

  private modeValue: PracticeMode
  private preparedValue = false
  private energyIsolatedValue = false
  private selectedToolIdValue?: string
  private selectedInstanceIdValue?: string
  private activeStepIdValue?: string
  private partsById: Map<string, WorkbenchPart>
  private trayZonesValue: TrayZone[]
  private observationsValue: WorkbenchObservation[] = []
  private warningsValue: string[] = []
  private eventsValue: WorkbenchEvent[] = []
  private nextSequenceValue = 0
  private readonly now: () => string
  private readonly checkpointsValue = new Map<string, WorkbenchSnapshot>()

  constructor(
    fixture: TechnicalMovementFixture,
    mode: PracticeMode = 'guided',
    now: () => string = () => new Date().toISOString(),
  ) {
    this.fixtureId = fixture.id
    this.fixtureVersion = fixture.version
    this.modeValue = mode
    this.now = now
    this.zones = createWorkbenchZones()
    this.tools = createWorkbenchTools()
    this.partsById = new Map(createWorkbenchParts(fixture).map((part) => [part.instanceId, part]))
    this.trayZonesValue = structuredClone(DEFAULT_TRAY_ZONES)
    const dependencies = createWorkbenchDependencies(fixture)
    this.disassembly = new WorkbenchDependencyGraph('disassembly', dependencies)
    this.assembly = new WorkbenchDependencyGraph('assembly', dependencies)
    const cycleDiagnostics = [...this.disassembly.diagnoseCycles(), ...this.assembly.diagnoseCycles()]
    this.warningsValue = cycleDiagnostics.map(({ message }) => message)
  }

  mode(): PracticeMode { return this.modeValue }
  prepared(): boolean { return this.preparedValue }
  energyIsolated(): boolean { return this.energyIsolatedValue }
  selectedToolId(): string | undefined { return this.selectedToolIdValue }
  selectedInstanceId(): string | undefined { return this.selectedInstanceIdValue }
  parts(): WorkbenchPart[] { return structuredClone([...this.partsById.values()]) }
  trayZones(): TrayZone[] { return structuredClone(this.trayZonesValue) }
  observations(): WorkbenchObservation[] { return structuredClone(this.observationsValue) }
  warnings(): string[] { return [...this.warningsValue] }
  events(): WorkbenchEvent[] { return structuredClone(this.eventsValue) }
  checkpoints(): string[] { return [...this.checkpointsValue.keys()] }

  part(instanceId: string): WorkbenchPart | undefined {
    const part = this.partsById.get(instanceId)
    return part ? structuredClone(part) : undefined
  }

  accessibilityModel(): WorkbenchAccessibilityModel {
    return {
      orderedZoneIds: this.zones.map(({ id }) => id),
      orderedToolIds: this.tools.map(({ id }) => id),
      orderedPartIds: [...this.partsById.keys()],
      actionMenu: [
        ['prepare', 'Preparar banco', 'Alt+P'],
        ['select-tool', 'Seleccionar herramienta', 'Alt+H'],
        ['select-part', 'Seleccionar pieza', 'Alt+E'],
        ['inspect', 'Inspeccionar pieza', 'Alt+I'],
        ['remove', 'Retirar pieza', 'Alt+R'],
        ['tray', 'Colocar en bandeja', 'Alt+B'],
        ['install', 'Instalar pieza', 'Alt+M'],
        ['undo', 'Restaurar checkpoint', 'Ctrl+Z'],
      ].map(([id, label, keyboardShortcut]) => ({ id, label, keyboardShortcut, requiresDrag: false })),
      trayRows: this.trayZonesValue.map((zone) => ({
        zoneId: zone.id,
        label: zone.label,
        partLabels: zone.instanceIds.map((id) => this.partsById.get(id)?.accessibleLabel ?? id),
      })),
      reducedMotion: {
        automaticMotion: false,
        discreteStateChanges: true,
        sameEvaluation: true,
      },
    }
  }

  snapshot(): WorkbenchSnapshot {
    return {
      schemaVersion: 1,
      fixtureId: this.fixtureId,
      fixtureVersion: this.fixtureVersion,
      mode: this.modeValue,
      prepared: this.preparedValue,
      energyIsolated: this.energyIsolatedValue,
      selectedToolId: this.selectedToolIdValue,
      selectedInstanceId: this.selectedInstanceIdValue,
      activeStepId: this.activeStepIdValue,
      parts: this.parts(),
      trayZones: this.trayZones(),
      observations: this.observations(),
      warnings: this.warnings(),
      events: this.events(),
      nextSequence: this.nextSequenceValue,
      createdAt: this.now(),
    }
  }

  serialize(): string {
    return JSON.stringify(this.snapshot())
  }

  restore(snapshot: WorkbenchSnapshot): void {
    if (snapshot.schemaVersion !== 1 || snapshot.fixtureId !== this.fixtureId || snapshot.fixtureVersion !== this.fixtureVersion) {
      throw new Error('El snapshot no corresponde al fixture y versión activos.')
    }
    const expectedIds = new Set(this.partsById.keys())
    const incomingIds = new Set(snapshot.parts.map(({ instanceId }) => instanceId))
    if (expectedIds.size !== incomingIds.size || [...expectedIds].some((id) => !incomingIds.has(id))) {
      throw new Error('El snapshot no conserva exactamente las identidades canónicas.')
    }
    this.modeValue = snapshot.mode
    this.preparedValue = snapshot.prepared
    this.energyIsolatedValue = snapshot.energyIsolated
    this.selectedToolIdValue = snapshot.selectedToolId
    this.selectedInstanceIdValue = snapshot.selectedInstanceId
    this.activeStepIdValue = snapshot.activeStepId
    this.partsById = new Map(snapshot.parts.map((part) => [part.instanceId, structuredClone(part)]))
    this.trayZonesValue = structuredClone(snapshot.trayZones)
    this.observationsValue = structuredClone(snapshot.observations)
    this.warningsValue = [...snapshot.warnings]
    this.eventsValue = structuredClone(snapshot.events)
    this.nextSequenceValue = snapshot.nextSequence
  }

  async dispatch(command: HandlingCommand): Promise<WorkbenchCommandResult> {
    const diagnostics = this.validate(command)
    if (diagnostics.some(({ blocking }) => blocking)) {
      return this.result(command, false, 'workbench-command-rejected', diagnostics)
    }
    switch (command.type) {
      case 'prepare-workbench':
        this.preparedValue = true
        return this.result(command, true, 'workbench-prepared')
      case 'select-tool':
        this.selectedToolIdValue = command.toolId
        return this.result(command, true, 'tool-selected', [], undefined, command.toolId)
      case 'isolate-energy':
        this.energyIsolatedValue = true
        return this.result(command, true, 'energy-isolated')
      case 'select-part':
        this.selectedInstanceIdValue = command.instanceId
        return this.result(command, true, 'part-selected', [], command.instanceId)
      case 'loosen-fastener':
        this.mutatePart(command.instanceId, (part) => { part.state = 'loosened' })
        return this.result(command, true, 'part-loosened', [], command.instanceId, command.toolId)
      case 'remove-part':
        this.mutatePart(command.instanceId, (part) => {
          part.state = 'removed'
          part.removalSequence = this.parts().filter(({ removalSequence }) => removalSequence !== undefined).length + 1
        })
        return this.result(command, true, 'part-removed', [], command.instanceId, command.toolId)
      case 'rotate-part':
        this.mutatePart(command.instanceId, (part) => {
          part.orientation = command.orientation
          part.state = part.state === 'placed-in-tray' ? 'placed-in-tray' : 'inspected'
        })
        return this.result(command, true, 'part-rotated', [], command.instanceId, command.toolId)
      case 'place-in-tray':
        this.placeInTray(command.instanceId, command.trayZoneId, command.note)
        return this.result(command, true, 'part-placed-in-tray', [], command.instanceId, command.toolId)
      case 'align-part':
        this.mutatePart(command.instanceId, (part) => {
          part.orientation = command.orientation
          part.state = 'aligned'
        })
        return this.result(command, true, 'part-aligned', [], command.instanceId, command.toolId)
      case 'install-part':
        this.removeFromTray(command.instanceId)
        this.mutatePart(command.instanceId, (part) => { part.state = 'installed-unverified' })
        return this.result(command, true, 'part-installed', [], command.instanceId, command.toolId)
      case 'tighten-fastener':
        this.removeFromTray(command.instanceId)
        this.mutatePart(command.instanceId, (part) => { part.state = 'installed-unverified' })
        return this.result(command, true, 'part-installed', [], command.instanceId, command.toolId)
      case 'verify-part':
        this.mutatePart(command.instanceId, (part) => { part.state = 'installed-verified' })
        return this.result(command, true, 'part-verified', [], command.instanceId)
      case 'inspect-part':
        this.mutatePart(command.instanceId, (part) => {
          if (!['placed-in-tray', 'loosened'].includes(part.state)) part.state = 'inspected'
        })
        return this.result(command, true, 'part-inspected', [], command.instanceId, command.toolId)
      case 'record-observation': {
        const observation: WorkbenchObservation = {
          ...structuredClone(command.observation),
          id: `observation.${this.observationsValue.length + 1}`,
          createdAt: this.now(),
        }
        this.observationsValue.push(observation)
        return this.result(command, true, 'observation-recorded', [], observation.instanceId)
      }
      case 'create-checkpoint': {
        this.activeStepIdValue = command.stepId
        const snapshot = this.snapshot()
        this.checkpointsValue.set(command.id, snapshot)
        return this.result(command, true, 'checkpoint-created')
      }
      case 'restore-snapshot':
        this.restore(command.snapshot)
        return this.result(command, true, 'snapshot-restored')
      case 'cancel-operation':
        return this.result(command, true, 'operation-cancelled')
    }
  }

  private validate(command: HandlingCommand): WorkbenchDiagnostic[] {
    if (command.type === 'restore-snapshot' || command.type === 'cancel-operation') return []
    if (command.type === 'prepare-workbench') return []
    if (!this.preparedValue) {
      return [{ code: 'WB-NOT-PREPARED', message: 'Prepara el banco antes de manipular el fixture.', blocking: true }]
    }
    if (command.type === 'select-tool') {
      return this.tools.some(({ id }) => id === command.toolId)
        ? []
        : [{ code: 'WB-UNKNOWN-TOOL', message: `Herramienta inexistente: ${command.toolId}.`, blocking: true }]
    }
    if (command.type === 'isolate-energy' || command.type === 'create-checkpoint' || command.type === 'record-observation') return []
    const instanceId = 'instanceId' in command ? command.instanceId : undefined
    const part = instanceId ? this.partsById.get(instanceId) : undefined
    if (!instanceId || !part) return [{ code: 'WB-UNKNOWN-PART', message: `Pieza inexistente: ${instanceId ?? 'sin ID'}.`, blocking: true }]
    if (part.state === 'blocked' || part.state === 'unknown') {
      return [{
        code: 'WB-PART-NOT-MANIPULABLE',
        message: `${part.label} es documental o no tiene geometría estructural utilizable.`,
        blocking: true,
        instanceId,
      }]
    }
    if (command.type === 'select-part') return []
    if (command.type === 'verify-part') {
      return part.state === 'installed-unverified'
        ? []
        : [{ code: 'WB-NOT-INSTALLED-UNVERIFIED', message: 'Solo se verifica una pieza instalada pendiente de comprobación.', blocking: true, instanceId }]
    }
    if ('toolId' in command) {
      const required = command.type === 'inspect-part'
        ? 'inspect'
        : command.type === 'loosen-fastener' || command.type === 'tighten-fastener'
          ? command.type === 'loosen-fastener' ? 'loosen-fastener' : 'tighten-fastener'
          : command.type === 'rotate-part' ? 'rotate-part'
          : command.type === 'place-in-tray' ? 'place-part'
          : command.type === 'align-part' ? capabilityForPart(part, 'align')
          : command.type === 'install-part' ? capabilityForPart(part, 'install')
          : capabilityForPart(part, 'remove')
      const diagnostic = this.validateTool(command.toolId, required, instanceId)
      if (diagnostic) return [diagnostic]
    }
    if ((command.type === 'loosen-fastener' || command.type === 'tighten-fastener') && !command.fitConfirmed) {
      return [{ code: 'WB-FASTENER-FIT-NOT-CONFIRMED', message: 'Confirma el ajuste de la hoja sin asumir una medida.', blocking: true, instanceId }]
    }
    if (command.type === 'loosen-fastener' && !part.fastener) {
      return [{ code: 'WB-NOT-A-FASTENER', message: 'La operación solo admite una instancia de tornillo.', blocking: true, instanceId }]
    }
    if (command.type === 'remove-part') {
      if (!this.energyIsolatedValue) {
        return [{ code: 'WB-ENERGY-NOT-ISOLATED', message: 'Aísla primero la fuente de energía a nivel educativo.', blocking: true, instanceId }]
      }
      if (part.fastener && part.state !== 'loosened') {
        return [{ code: 'WB-FASTENER-NOT-LOOSENED', message: 'El tornillo conserva identidad y debe aflojarse antes de retirarlo.', blocking: true, instanceId }]
      }
      const unmet = this.disassembly.unmet(instanceId, this.partsById)
      if (unmet.length) return unmet.map((dependency) => ({
        code: 'WB-DISASSEMBLY-DEPENDENCY',
        message: `Debe retirarse antes ${this.partsById.get(dependency.beforeInstanceId)?.label ?? dependency.beforeInstanceId}.`,
        blocking: true,
        instanceId,
        dependencyId: dependency.id,
      }))
    }
    if (command.type === 'place-in-tray') {
      if (part.state !== 'removed' && part.state !== 'inspected') {
        return [{ code: 'WB-PART-NOT-REMOVED', message: 'Solo una pieza retirada puede entrar en bandeja.', blocking: true, instanceId }]
      }
      if (!this.trayZonesValue.some(({ id }) => id === command.trayZoneId)) {
        return [{ code: 'WB-UNKNOWN-TRAY-ZONE', message: 'La zona de bandeja no existe.', blocking: true, instanceId }]
      }
    }
    if (command.type === 'align-part' && !['placed-in-tray', 'ready-to-install', 'removed'].includes(part.state)) {
      return [{ code: 'WB-PART-NOT-READY', message: 'La pieza no está lista para alinear.', blocking: true, instanceId }]
    }
    if (command.type === 'install-part') {
      if (part.fastener) {
        return [{ code: 'WB-FASTENER-USES-TIGHTEN', message: 'Un tornillo se instala con la operación de apriete y conserva su identidad.', blocking: true, instanceId }]
      }
      if (part.state !== 'aligned') {
        return [{ code: 'WB-PART-NOT-ALIGNED', message: 'Registra orientación y alineación antes de instalar.', blocking: true, instanceId }]
      }
      const unmet = this.assembly.unmet(instanceId, this.partsById)
      if (unmet.length) return unmet.map((dependency) => ({
        code: 'WB-ASSEMBLY-DEPENDENCY',
        message: `Debe estar presente antes ${this.partsById.get(dependency.beforeInstanceId)?.label ?? dependency.beforeInstanceId}.`,
        blocking: true,
        instanceId,
        dependencyId: dependency.id,
      }))
    }
    if (command.type === 'tighten-fastener' && !['aligned', 'placed-in-tray', 'ready-to-install'].includes(part.state)) {
      return [{ code: 'WB-FASTENER-NOT-READY', message: 'El tornillo no está preparado para instalar.', blocking: true, instanceId }]
    }
    return []
  }

  private validateTool(toolId: string, capability: ToolCapability, instanceId: string): WorkbenchDiagnostic | undefined {
    const tool = this.tools.find(({ id }) => id === toolId)
    if (!tool) return { code: 'WB-UNKNOWN-TOOL', message: `Herramienta inexistente: ${toolId}.`, blocking: true, instanceId }
    if (!tool.capabilities.includes(capability)) {
      return {
        code: 'WB-WRONG-TOOL',
        message: `${tool.label} no declara la capacidad ${capability}.`,
        blocking: true,
        instanceId,
      }
    }
    return undefined
  }

  private mutatePart(instanceId: string, mutate: (part: WorkbenchPart) => void): void {
    const part = this.partsById.get(instanceId)
    if (!part) throw new Error(`Pieza inexistente: ${instanceId}`)
    mutate(part)
  }

  private placeInTray(instanceId: string, trayZoneId: string, note?: string): void {
    this.removeFromTray(instanceId)
    const zone = this.trayZonesValue.find(({ id }) => id === trayZoneId)
    if (!zone) throw new Error(`Zona inexistente: ${trayZoneId}`)
    zone.instanceIds.push(instanceId)
    this.mutatePart(instanceId, (part) => {
      part.state = 'placed-in-tray'
      part.trayZoneId = trayZoneId
      part.note = note
    })
  }

  private removeFromTray(instanceId: string): void {
    this.trayZonesValue.forEach((zone) => {
      zone.instanceIds = zone.instanceIds.filter((id) => id !== instanceId)
    })
    this.mutatePart(instanceId, (part) => { part.trayZoneId = undefined })
  }

  private result(
    command: HandlingCommand,
    accepted: boolean,
    type: WorkbenchEvent['type'],
    diagnostics: WorkbenchDiagnostic[] = [],
    instanceId?: string,
    toolId?: string,
  ): WorkbenchCommandResult {
    const event: WorkbenchEvent = {
      sequence: this.nextSequenceValue,
      timestamp: this.now(),
      type,
      commandId: command.id,
      instanceId,
      toolId,
      mode: this.modeValue,
      diagnosticCodes: diagnostics.map(({ code }) => code),
      evidence: {
        accepted,
        prepared: this.preparedValue,
        energyIsolated: this.energyIsolatedValue,
        assistance: this.modeValue === 'guided' ? 'full' : this.modeValue === 'assisted' ? 'on-error' : 'none',
        fixtureLimitations: 'R2/G2/K2/P0; no service sequence complete or physical validation',
      },
    }
    this.nextSequenceValue += 1
    this.eventsValue.push(event)
    return { accepted, event: structuredClone(event), diagnostics: structuredClone(diagnostics) }
  }
}

export function restoreVirtualWorkbench(
  fixture: TechnicalMovementFixture,
  serialized: string,
  now?: () => string,
): VirtualWorkbench {
  const snapshot = JSON.parse(serialized) as WorkbenchSnapshot
  const workbench = new VirtualWorkbench(fixture, snapshot.mode, now)
  workbench.restore(snapshot)
  return workbench
}
