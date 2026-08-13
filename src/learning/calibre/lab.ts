import { stableFingerprint } from '../identity'
import { MechanicalLearningLab } from '../mechanical'
import { MIYOTA_8215_TECHNICAL_FIXTURE } from '../technical/fixtures'
import {
  restoreVirtualWorkbench,
  VirtualWorkbench,
  type HandlingCommand,
  type PracticeMode,
  type WorkbenchCommandResult,
} from '../workbench'
import { CalibreDependencyGraph } from './dependencies'
import {
  create8215Audit,
  create8215Dependencies,
  create8215Operations,
  create8215Subsystems,
} from './fixture8215'
import type {
  CalibreCommandResult,
  CalibreFault,
  CalibreFaultKind,
  CalibreHypothesis,
  CalibreInspectionFinding,
  CalibreLabCommand,
  CalibreLabEvent,
  CalibreOperation,
  CalibreProjectDossier,
  CalibreSessionSnapshot,
  CalibreVerificationKind,
  CalibreVerificationResult,
} from './model'

const fixture = MIYOTA_8215_TECHNICAL_FIXTURE
const OFFICIAL_SOURCE_IDS = fixture.sourceIds

const faultDefinitions: Record<CalibreFaultKind, Omit<CalibreFault, 'kind' | 'active'>> = {
  'does-not-start': { symptom: 'El indicador no inicia.', affectedSubsystemIds: ['subsystem.8215.regulation', 'subsystem.8215.escapement'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['Síntoma no específico; no identifica una causa física.'] },
  'does-not-transmit': { symptom: 'La cadena funcional se interrumpe.', affectedSubsystemIds: ['subsystem.8215.train'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['Interrupción simbólica, sin par ni fricción.'] },
  'rotor-blocked': { symptom: 'El rotor no recorre su arco.', affectedSubsystemIds: ['subsystem.8215.automatic'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No representa cojinete, roce o choque reales.'] },
  'automatic-disconnected': { symptom: 'El automático no enlaza con el barrilete.', affectedSubsystemIds: ['subsystem.8215.automatic', 'subsystem.8215.barrel'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['Ruta funcional resumida.'] },
  'barrel-empty': { symptom: 'No existe energía normalizada almacenada.', affectedSubsystemIds: ['subsystem.8215.barrel'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No simula la curva real de par.'] },
  'train-interrupted': { symptom: 'Una rueda no transmite a la siguiente.', affectedSubsystemIds: ['subsystem.8215.train'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No atribuye conteos de dientes al 8215.'] },
  'escapement-blocked': { symptom: 'El escape permanece en bloqueo.', affectedSubsystemIds: ['subsystem.8215.escapement'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No mide ángulos, penetración o seguridad.'] },
  'balance-stopped': { symptom: 'El volante no oscila.', affectedSubsystemIds: ['subsystem.8215.regulation'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No concluye causa física ni marcha.'] },
  'incorrect-stem-state': { symptom: 'La tija dirige la acción a una ruta no esperada.', affectedSubsystemIds: ['subsystem.8215.keyless'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['Árbol de estado educativo basado en relaciones disponibles.'] },
  'calendar-blocked': { symptom: 'La fecha no avanza en el ciclo educativo.', affectedSubsystemIds: ['subsystem.8215.calendar'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No define una ventana horaria segura.'] },
  'missing-part': { symptom: 'Una identidad esperada no está instalada.', affectedSubsystemIds: ['subsystem.8215.structure'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['Ausencia de overlay; no observación física.'] },
  'wrong-fastener': { symptom: 'Una fijación no coincide con su identidad contextual.', affectedSubsystemIds: ['subsystem.8215.supports'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No prescribe intercambiabilidad ni par.'] },
  'bridge-not-seated': { symptom: 'Un puente aparece sin asiento visual.', affectedSubsystemIds: ['subsystem.8215.structure'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No representa fuerza o tolerancia.'] },
  'pivot-outside-support': { symptom: 'Un pivote queda fuera del apoyo simbólico.', affectedSubsystemIds: ['subsystem.8215.supports', 'subsystem.8215.train'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['Error exagerado sin micras ni holguras.'] },
  'hands-blocked': { symptom: 'La indicación aparece bloqueada.', affectedSubsystemIds: ['subsystem.8215.motion-works'], affectedInstanceIds: [], classification: 'educational-simulation', reversible: true, limitations: ['No mide altura, paralelismo o roce real.'] },
}

function initialProject(): CalibreProjectDossier {
  return {
    identified: false,
    documentationReviewed: false,
    subsystemIds: [],
    plannedOperationIds: [],
    removedInstanceIds: [],
    trayInstanceIds: [],
    inspectedInstanceIds: [],
    installedInstanceIds: [],
    verificationIds: [],
    diagnosisIds: [],
    recognizedLimitations: [],
    passedChecks: [],
    pendingChecks: ['identidad', 'documentación', 'arquitectura', 'plan', 'manipulación permitida', 'inspección', 'montaje', 'comprobaciones', 'diagnóstico', 'revisión humana'],
  }
}

export class CalibreLearningLab {
  readonly fixtureId = fixture.id
  readonly fixtureVersion = fixture.version
  readonly fixtureFingerprint = stableFingerprint(fixture)
  readonly audits = create8215Audit()
  readonly operations: CalibreOperation[] = create8215Operations(this.audits)
  readonly subsystems = create8215Subsystems(fixture, this.audits, this.operations)
  readonly dependencies = create8215Dependencies()
  readonly disassembly = new CalibreDependencyGraph('disassembly', this.dependencies)
  readonly assembly = new CalibreDependencyGraph('assembly', this.dependencies)
  readonly structure = new CalibreDependencyGraph('structure', this.dependencies)
  readonly function = new CalibreDependencyGraph('function', this.dependencies)
  workbench: VirtualWorkbench
  mechanicalLab: MechanicalLearningLab

  private modeValue: PracticeMode
  private reducedMotionValue: boolean
  private selectedSubsystemIdValue = 'subsystem.8215.structure'
  private selectedInstanceIdValue?: string
  private viewModeValue: CalibreSessionSnapshot['viewMode'] = 'complete'
  private documentationReviewedValue = false
  private disassemblyPlanValue: string[] = []
  private activeContextualLabValue?: CalibreSessionSnapshot['activeContextualLab']
  private cameraBookmarkValue = 'camera.8215.complete'
  private inspectionFindingsValue: CalibreInspectionFinding[] = []
  private verificationsValue: CalibreVerificationResult[] = []
  private faultsValue: CalibreFault[]
  private hypothesesValue: CalibreHypothesis[] = []
  private projectValue = initialProject()
  private eventsValue: CalibreLabEvent[] = []
  private nextSequenceValue = 0
  private readonly now: () => string

  constructor(
    mode: PracticeMode = 'guided',
    reducedMotion = false,
    now: () => string = () => new Date().toISOString(),
  ) {
    this.modeValue = mode
    this.reducedMotionValue = reducedMotion
    this.now = now
    this.workbench = new VirtualWorkbench(fixture, mode, now)
    this.mechanicalLab = new MechanicalLearningLab(reducedMotion, now)
    this.faultsValue = (Object.entries(faultDefinitions) as Array<[CalibreFaultKind, Omit<CalibreFault, 'kind' | 'active'>]>)
      .map(([kind, definition]) => ({ kind, active: false, ...structuredClone(definition) }))
  }

  mode(): PracticeMode { return this.modeValue }
  selectedSubsystemId(): string { return this.selectedSubsystemIdValue }
  selectedInstanceId(): string | undefined { return this.selectedInstanceIdValue }
  events(): CalibreLabEvent[] { return structuredClone(this.eventsValue) }

  snapshot(): CalibreSessionSnapshot {
    this.refreshProject()
    return {
      schemaVersion: 1,
      fixtureId: 'fixture.miyota.8215.structural',
      fixtureVersion: this.fixtureVersion,
      mode: this.modeValue,
      reducedMotion: this.reducedMotionValue,
      selectedSubsystemId: this.selectedSubsystemIdValue,
      selectedInstanceId: this.selectedInstanceIdValue,
      viewMode: this.viewModeValue,
      documentationReviewed: this.documentationReviewedValue,
      disassemblyPlan: [...this.disassemblyPlanValue],
      activeContextualLab: this.activeContextualLabValue,
      cameraBookmark: this.cameraBookmarkValue,
      workbench: this.workbench.snapshot(),
      mechanicalLab: this.mechanicalLab.snapshot(),
      inspectionFindings: structuredClone(this.inspectionFindingsValue),
      verifications: structuredClone(this.verificationsValue),
      faults: structuredClone(this.faultsValue),
      hypotheses: structuredClone(this.hypothesesValue),
      project: structuredClone(this.projectValue),
      events: this.events(),
      nextSequence: this.nextSequenceValue,
    }
  }

  serialize(): string {
    return JSON.stringify(this.snapshot())
  }

  restore(snapshot: CalibreSessionSnapshot): void {
    if (snapshot.schemaVersion !== 1 || snapshot.fixtureId !== this.fixtureId || snapshot.fixtureVersion !== this.fixtureVersion) {
      throw new Error('El snapshot no corresponde al fixture 8215 activo.')
    }
    const expected = new Set(this.audits.map(({ instanceId }) => instanceId))
    const incoming = new Set(snapshot.workbench.parts.map(({ instanceId }) => instanceId))
    if (expected.size !== incoming.size || [...expected].some((id) => !incoming.has(id))) {
      throw new Error('El snapshot no conserva las 63 identidades del 8215.')
    }
    this.modeValue = snapshot.mode
    this.reducedMotionValue = snapshot.reducedMotion
    this.selectedSubsystemIdValue = snapshot.selectedSubsystemId
    this.selectedInstanceIdValue = snapshot.selectedInstanceId
    this.viewModeValue = snapshot.viewMode
    this.documentationReviewedValue = snapshot.documentationReviewed
    this.disassemblyPlanValue = [...snapshot.disassemblyPlan]
    this.activeContextualLabValue = snapshot.activeContextualLab
    this.cameraBookmarkValue = snapshot.cameraBookmark
    this.workbench = restoreVirtualWorkbench(fixture, JSON.stringify(snapshot.workbench), this.now)
    this.mechanicalLab.restore(snapshot.mechanicalLab)
    this.inspectionFindingsValue = structuredClone(snapshot.inspectionFindings)
    this.verificationsValue = structuredClone(snapshot.verifications)
    this.faultsValue = structuredClone(snapshot.faults)
    this.hypothesesValue = structuredClone(snapshot.hypotheses)
    this.projectValue = structuredClone(snapshot.project)
    this.eventsValue = structuredClone(snapshot.events)
    this.nextSequenceValue = snapshot.nextSequence
    this.refreshProject()
  }

  async workbenchCommand(command: HandlingCommand): Promise<WorkbenchCommandResult> {
    const result = await this.workbench.dispatch(command)
    this.emit(`workbench:${command.type}`, command.id, result.accepted, {
      instanceId: result.event.instanceId,
      authority: result.event.instanceId ? this.operationAuthority(command.type, result.event.instanceId) : undefined,
      diagnostics: result.event.diagnosticCodes,
      evidence: {
        workbenchEventType: result.event.type,
        instanceId: result.event.instanceId ?? null,
        toolId: result.event.toolId ?? null,
      },
    })
    this.refreshProject()
    return result
  }

  async dispatch(command: CalibreLabCommand): Promise<CalibreCommandResult> {
    const diagnostics = this.validate(command)
    if (diagnostics.some(({ blocking }) => blocking)) {
      return this.result(command, false, diagnostics)
    }
    switch (command.type) {
      case 'identify-calibre':
        this.projectValue.identified = true
        break
      case 'review-documentation':
        this.documentationReviewedValue = command.sourceIds.every((sourceId) => OFFICIAL_SOURCE_IDS.includes(sourceId))
        this.projectValue.documentationReviewed = this.documentationReviewedValue
        break
      case 'select-subsystem':
        this.selectedSubsystemIdValue = command.subsystemId
        if (!this.projectValue.subsystemIds.includes(command.subsystemId)) this.projectValue.subsystemIds.push(command.subsystemId)
        break
      case 'select-instance':
        this.selectedInstanceIdValue = command.instanceId
        break
      case 'change-view':
        this.viewModeValue = command.viewMode
        this.cameraBookmarkValue = `camera.8215.${command.viewMode}`
        break
      case 'create-disassembly-plan':
        this.disassemblyPlanValue = [...command.operationIds]
        this.projectValue.plannedOperationIds = [...command.operationIds]
        break
      case 'open-contextual-lab':
        this.activeContextualLabValue = command.lab
        break
      case 'close-contextual-lab':
        this.activeContextualLabValue = undefined
        break
      case 'inspect':
        this.recordInspection(command.instanceId, command.defect)
        break
      case 'verify':
        this.recordVerification(command.kind)
        break
      case 'introduce-fault':
        this.setFault(command.fault, true)
        break
      case 'clear-fault':
        this.setFault(command.fault, false)
        break
      case 'form-hypothesis':
        this.hypothesesValue.push({
          ...structuredClone(command.hypothesis),
          id: `hypothesis.8215.${this.hypothesesValue.length + 1}`,
          prohibitedConclusion: 'No puede afirmarse una avería física confirmada a partir de una simulación educativa.',
        })
        break
      case 'evaluate-hypothesis': {
        const hypothesis = this.hypothesesValue.find(({ id }) => id === command.hypothesisId)
        if (hypothesis) {
          hypothesis.result = command.result
          hypothesis.permittedConclusion = command.permittedConclusion
          if (!this.projectValue.diagnosisIds.includes(hypothesis.id)) this.projectValue.diagnosisIds.push(hypothesis.id)
        }
        break
      }
      case 'recognize-limit':
        if (!this.projectValue.recognizedLimitations.includes(command.limitation)) this.projectValue.recognizedLimitations.push(command.limitation)
        break
      case 'restore':
        this.restore(command.snapshot)
        break
    }
    this.refreshProject()
    return this.result(command, true, [])
  }

  accessibilityModel() {
    const subsystemTree = this.subsystems.map((subsystem) => ({
      id: subsystem.id,
      label: subsystem.label,
      instanceRows: subsystem.instanceIds.map((instanceId) => {
        const audit = this.audits.find((entry) => entry.instanceId === instanceId)!
        const workbenchPart = this.workbench.part(instanceId)
        return {
          instanceId,
          label: `${audit.nameEs}; referencia ${audit.officialReference ?? 'sin referencia de recambio'}; ${instanceId}`,
          state: workbenchPart?.state ?? 'unknown',
          dependencies: [
            ...this.disassembly.incoming(instanceId),
            ...this.assembly.incoming(instanceId),
            ...this.structure.incoming(instanceId),
          ].map(({ id, kind, authority }) => `${id}: ${kind}; ${authority}`),
          availableActions: this.operations.filter((operation) => operation.instanceId === instanceId).map(({ action }) => action),
        }
      }),
    }))
    return {
      subsystemTree,
      trayRows: this.workbench.accessibilityModel().trayRows,
      fastenerRows: this.audits
        .filter(({ subsystem }) => subsystem === 'fasteners')
        .map(({ instanceId, nameEs, officialReference }) => ({ instanceId, label: `${nameEs}; ${officialReference}; ${instanceId}` })),
      faults: this.faultsValue.map(({ kind, symptom, active }) => ({ kind, symptom, active })),
      reducedMotion: {
        automaticCamera: false,
        discreteStates: true,
        staticRotationArcs: true,
        numberedEnergySteps: true,
        manualEscapementPhases: true,
        sameEvaluation: true,
      },
    }
  }

  private validate(command: CalibreLabCommand) {
    const diagnostics: Array<{ code: string; message: string; blocking: boolean }> = []
    if (command.type === 'review-documentation') {
      const invalid = command.sourceIds.filter((sourceId) => !OFFICIAL_SOURCE_IDS.includes(sourceId))
      if (invalid.length) diagnostics.push({ code: 'CALIBRE-SOURCE-UNKNOWN', message: `Fuentes no registradas: ${invalid.join(', ')}`, blocking: true })
    }
    if (command.type === 'select-subsystem' && !this.subsystems.some(({ id }) => id === command.subsystemId)) {
      diagnostics.push({ code: 'CALIBRE-SUBSYSTEM-UNKNOWN', message: 'Subsistema no registrado.', blocking: true })
    }
    if ((command.type === 'select-instance' || command.type === 'inspect') && !this.audits.some(({ instanceId }) => instanceId === command.instanceId)) {
      diagnostics.push({ code: 'CALIBRE-INSTANCE-UNKNOWN', message: 'Instancia no registrada.', blocking: true })
    }
    if (command.type === 'create-disassembly-plan') {
      const valid = new Set(this.operations.filter(({ phase }) => phase === 'disassembly').map(({ id }) => id))
      const invalid = command.operationIds.filter((id) => !valid.has(id))
      if (invalid.length) diagnostics.push({ code: 'CALIBRE-PLAN-UNKNOWN-OPERATION', message: `Operaciones ajenas al desmontaje: ${invalid.join(', ')}`, blocking: true })
      if (!this.documentationReviewedValue) diagnostics.push({ code: 'CALIBRE-DOCUMENTATION-REQUIRED', message: 'Revisa la documentación antes de fijar el plan.', blocking: true })
    }
    if (command.type === 'evaluate-hypothesis' && !this.hypothesesValue.some(({ id }) => id === command.hypothesisId)) {
      diagnostics.push({ code: 'CALIBRE-HYPOTHESIS-UNKNOWN', message: 'Hipótesis no registrada.', blocking: true })
    }
    return diagnostics
  }

  private operationAuthority(commandType: HandlingCommand['type'], instanceId: string) {
    const actionByCommand: Partial<Record<HandlingCommand['type'], CalibreOperation['action']>> = {
      'loosen-fastener': 'loosen-fastener',
      'remove-part': 'remove',
      'place-in-tray': 'place-in-tray',
      'inspect-part': 'inspect',
      'align-part': 'align',
      'install-part': 'install',
      'tighten-fastener': 'tighten-fastener',
      'verify-part': 'verify',
    }
    const action = actionByCommand[commandType]
    return this.operations.find((operation) => operation.instanceId === instanceId && operation.action === action)?.authority
  }

  private recordInspection(instanceId: string, defect?: CalibreInspectionFinding['defect']) {
    const audit = this.audits.find((entry) => entry.instanceId === instanceId)!
    const finding: CalibreInspectionFinding = {
      id: `inspection.8215.${this.inspectionFindingsValue.length + 1}`,
      instanceId,
      defect: defect ?? 'none',
      classification: defect ? 'symbolic' : 'documentary',
      observation: defect ? `Defecto educativo ${defect} aplicado a ${audit.nameEs}.` : `Inspección visual declarada de ${audit.nameEs}.`,
      sourceIds: [...audit.sourceIds],
      reversible: true,
      limitations: ['No contiene tolerancias ni concluye el estado de una unidad física.'],
    }
    this.inspectionFindingsValue.push(finding)
  }

  private recordVerification(kind: CalibreVerificationKind) {
    const parts = this.workbench.parts()
    const activeFaults = this.faultsValue.filter(({ active }) => active)
    const blockedByFault: Partial<Record<CalibreVerificationKind, CalibreFaultKind[]>> = {
      'train-visual-freedom': ['train-interrupted', 'pivot-outside-support'],
      'functional-continuity': ['does-not-transmit', 'automatic-disconnected', 'train-interrupted', 'escapement-blocked'],
      alignment: ['bridge-not-seated', 'pivot-outside-support'],
      'fastener-identity': ['wrong-fastener'],
      orientation: ['bridge-not-seated'],
      'energy-route': ['barrel-empty', 'automatic-disconnected'],
      'calendar-state': ['calendar-blocked'],
      'stem-state': ['incorrect-stem-state'],
      'rotor-presence': ['rotor-blocked', 'missing-part'],
      'assembly-restored': ['missing-part', 'wrong-fastener', 'bridge-not-seated'],
    }
    const unsupported = kind === 'train-visual-freedom'
    const failed = activeFaults.some(({ kind: fault }) => blockedByFault[kind]?.includes(fault))
      || (kind === 'supports-present' && parts.some(({ state }) => state === 'removed'))
    const result: CalibreVerificationResult = {
      id: `verification.8215.${this.verificationsValue.length + 1}`,
      kind,
      status: unsupported && !failed ? 'not-supported' : failed ? 'failed' : 'passed',
      verifies: [`Estado visual y relaciones declaradas para ${kind}.`],
      doesNotVerify: ['Funcionamiento físico, tolerancias, fuerza, par, lubricación, desgaste o marcha cronométrica.'],
      fidelity: {
        geometry: 'G2',
        kinematics: kind === 'functional-continuity' || kind === 'energy-route' ? 'K2' : 'K1',
        physics: 'P0',
        limitations: ['Comprobación parcial educativa.'],
      },
      limitation: unsupported
        ? 'Una animación libre no demuestra libertad física del tren.'
        : 'Resultado limitado al estado semántico del fixture R2.',
      affectedInstanceIds: parts.filter(({ state }) => ['removed', 'unknown', 'blocked'].includes(state)).map(({ instanceId }) => instanceId),
    }
    this.verificationsValue.push(result)
  }

  private setFault(kind: CalibreFaultKind, active: boolean) {
    const fault = this.faultsValue.find((entry) => entry.kind === kind)
    if (fault) fault.active = active
  }

  private refreshProject() {
    const parts = this.workbench.parts()
    this.projectValue.documentationReviewed = this.documentationReviewedValue
    this.projectValue.removedInstanceIds = parts.filter(({ state }) => state === 'removed').map(({ instanceId }) => instanceId)
    this.projectValue.trayInstanceIds = parts.filter(({ state }) => state === 'placed-in-tray').map(({ instanceId }) => instanceId)
    this.projectValue.inspectedInstanceIds = [...new Set([
      ...parts.filter(({ state }) => state === 'inspected').map(({ instanceId }) => instanceId),
      ...this.inspectionFindingsValue.map(({ instanceId }) => instanceId),
    ])]
    this.projectValue.installedInstanceIds = parts
      .filter(({ state }) => ['installed-unverified', 'installed-verified'].includes(state))
      .map(({ instanceId }) => instanceId)
    this.projectValue.verificationIds = this.verificationsValue.map(({ id }) => id)
    const checks = [
      ['identidad', this.projectValue.identified],
      ['documentación', this.documentationReviewedValue],
      ['arquitectura', this.projectValue.subsystemIds.length >= 5],
      ['plan', this.disassemblyPlanValue.length > 0],
      ['manipulación permitida', this.projectValue.removedInstanceIds.length > 0 || this.projectValue.trayInstanceIds.length > 0],
      ['inspección', this.projectValue.inspectedInstanceIds.length > 0],
      ['montaje', this.projectValue.installedInstanceIds.length > 0],
      ['comprobaciones', this.projectValue.verificationIds.length > 0],
      ['diagnóstico', this.projectValue.diagnosisIds.length > 0],
    ] as Array<[string, boolean]>
    this.projectValue.passedChecks = checks.filter(([, passed]) => passed).map(([name]) => name)
    this.projectValue.pendingChecks = [
      ...checks.filter(([, passed]) => !passed).map(([name]) => name),
      'revisión humana',
    ]
  }

  private result(
    command: CalibreLabCommand,
    accepted: boolean,
    diagnostics: Array<{ code: string; message: string; blocking: boolean }>,
  ): CalibreCommandResult {
    const event = this.emit(command.type, command.id, accepted, {
      instanceId: 'instanceId' in command ? command.instanceId : undefined,
      authority: 'simulation-only',
      diagnostics: diagnostics.map(({ code }) => code),
      evidence: {
        fixtureId: this.fixtureId,
        fixtureVersion: this.fixtureVersion,
        commandType: command.type,
        selectedSubsystemId: this.selectedSubsystemIdValue,
        selectedInstanceId: this.selectedInstanceIdValue ?? null,
        fidelity: 'G2/K2/P0',
      },
    })
    return { accepted, event, diagnostics }
  }

  private emit(
    type: string,
    commandId: string,
    accepted: boolean,
    input: {
      instanceId?: string
      authority?: CalibreLabEvent['authority']
      diagnostics?: string[]
      evidence: CalibreLabEvent['evidence']
    },
  ): CalibreLabEvent {
    const event: CalibreLabEvent = {
      sequence: this.nextSequenceValue++,
      timestamp: this.now(),
      type,
      commandId,
      accepted,
      instanceId: input.instanceId,
      authority: input.authority,
      diagnosticCodes: input.diagnostics ?? [],
      evidence: structuredClone(input.evidence),
    }
    this.eventsValue.push(event)
    return structuredClone(event)
  }
}

export function restoreCalibreLearningLab(
  serialized: string,
  now?: () => string,
): CalibreLearningLab {
  const snapshot = JSON.parse(serialized) as CalibreSessionSnapshot
  const lab = new CalibreLearningLab(snapshot.mode, snapshot.reducedMotion, now)
  lab.restore(snapshot)
  return lab
}
