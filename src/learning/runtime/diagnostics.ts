import type { SemanticSelector } from './selectors'

export type RuntimeDiagnosticSeverity = 'info' | 'warning' | 'error' | 'fatal'

export type RuntimeDiagnosticCategory =
  | 'package-error'
  | 'content-error'
  | 'version-incompatible'
  | 'capability-missing'
  | 'selector-empty'
  | 'selector-ambiguous'
  | 'invalid-state'
  | 'bridge-error'
  | 'restoration-incomplete'
  | 'internal-error'

export interface RuntimeDiagnostic {
  code: string
  category: RuntimeDiagnosticCategory
  severity: RuntimeDiagnosticSeverity
  message: string
  technicalDetail?: string
  source: 'loader' | 'registry' | 'compiler' | 'selector' | 'runtime' | 'timeline' | 'command-bus' | 'bridge'
  packageId?: string
  packageVersion?: string
  sceneId?: string
  stepId?: string
  selector?: SemanticSelector
  entityId?: string
  suggestedRecovery?: string
  blocking: boolean
  retrySafe: boolean
}

export function diagnostic(
  input: Omit<RuntimeDiagnostic, 'severity' | 'blocking' | 'retrySafe'>
    & Partial<Pick<RuntimeDiagnostic, 'severity' | 'blocking' | 'retrySafe'>>,
): RuntimeDiagnostic {
  const severity = input.severity ?? 'error'
  return {
    ...input,
    severity,
    blocking: input.blocking ?? (severity === 'error' || severity === 'fatal'),
    retrySafe: input.retrySafe ?? false,
  }
}

export function hasBlockingDiagnostics(diagnostics: RuntimeDiagnostic[]): boolean {
  return diagnostics.some(({ blocking }) => blocking)
}
