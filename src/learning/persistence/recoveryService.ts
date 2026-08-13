import type { PersistentLearningSession } from './models'
import type { LearningRepository } from './repository'

export type RecoveryAction = 'resume' | 'resume-with-warning' | 'rebase' | 'read-only-review' | 'restart-new-attempt' | 'archive' | 'cancel'

export interface LearningRecoveryContext {
  packageAvailable: boolean
  exactPackageVersionAvailable: boolean
  projectAvailable: boolean
  currentProjectFingerprint?: string
  currentCapabilities: string[]
  currentRuntimeVersion: string
  migrationsPending: boolean
  selectorsReproducible: boolean
}

export interface LearningRecoveryReport {
  sessionId: string
  resumable: boolean
  issues: Array<{ code: string; severity: 'warning' | 'error'; message: string }>
  allowedActions: RecoveryAction[]
  projectChange: 'unchanged' | 'changed-reproducible' | 'changed-incompatible' | 'missing'
}

export class LearningRecoveryService {
  private readonly repository: LearningRepository

  constructor(repository: LearningRepository) {
    this.repository = repository
  }

  async inspect(sessionId: string, context: LearningRecoveryContext): Promise<LearningRecoveryReport> {
    const session = await this.repository.getSession(sessionId)
    if (!session) throw new Error(`Sesión inexistente: ${sessionId}.`)
    const issues: LearningRecoveryReport['issues'] = []
    if (!context.packageAvailable || !context.exactPackageVersionAvailable) issues.push({ code: 'RECOVERY-PACKAGE-MISSING', severity: 'error', message: 'No está disponible la versión exacta del paquete.' })
    if (!session.checkpoint?.complete) issues.push({ code: 'RECOVERY-CHECKPOINT-INCOMPLETE', severity: 'error', message: 'El checkpoint está incompleto o ausente.' })
    if (context.migrationsPending) issues.push({ code: 'RECOVERY-MIGRATION-PENDING', severity: 'error', message: 'Hay una migración pendiente antes de interpretar la sesión.' })
    const missingCapabilities = session.initialCapabilities.filter((capability) => !context.currentCapabilities.includes(capability))
    if (missingCapabilities.length > 0) issues.push({ code: 'RECOVERY-CAPABILITIES-DIFFERENT', severity: 'error', message: `Faltan capacidades: ${missingCapabilities.join(', ')}.` })
    if (context.currentRuntimeVersion.split('.')[0] !== session.runtimeVersion.split('.')[0]) issues.push({ code: 'RECOVERY-RUNTIME-MAJOR', severity: 'warning', message: 'La versión principal del runtime ha cambiado.' })
    let projectChange: LearningRecoveryReport['projectChange'] = 'unchanged'
    if (!context.projectAvailable || !context.currentProjectFingerprint) projectChange = 'missing'
    else if (context.currentProjectFingerprint !== session.currentProjectFingerprint) projectChange = context.selectorsReproducible ? 'changed-reproducible' : 'changed-incompatible'
    if (projectChange === 'missing') issues.push({ code: 'RECOVERY-PROJECT-MISSING', severity: 'error', message: 'El proyecto técnico no está disponible.' })
    if (projectChange === 'changed-reproducible') issues.push({ code: 'RECOVERY-PROJECT-CHANGED', severity: 'warning', message: 'El proyecto cambió, pero los selectores siguen siendo reproducibles.' })
    if (projectChange === 'changed-incompatible') issues.push({ code: 'RECOVERY-PROJECT-INCOMPATIBLE', severity: 'error', message: 'El proyecto cambió y la escena ya no es reproducible.' })
    const blockers = issues.some(({ severity }) => severity === 'error')
    const allowedActions: RecoveryAction[] = blockers
      ? ['read-only-review', 'restart-new-attempt', 'archive', 'cancel']
      : projectChange === 'changed-reproducible'
        ? ['resume-with-warning', 'rebase', 'read-only-review', 'restart-new-attempt', 'archive', 'cancel']
        : ['resume', 'read-only-review', 'restart-new-attempt', 'archive', 'cancel']
    return { sessionId, resumable: !blockers, issues, allowedActions, projectChange }
  }

  async interruptedSessions(profileId: string): Promise<PersistentLearningSession[]> {
    return (await this.repository.listSessions(profileId, { limit: 500 }, true)).items
      .filter(({ state }) => state === 'interrupted' || state === 'suspended')
  }
}
