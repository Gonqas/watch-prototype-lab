import type {
  WorkbenchDependency,
  WorkbenchDiagnostic,
  WorkbenchPart,
} from './model'

export class WorkbenchDependencyGraph {
  readonly phase: WorkbenchDependency['phase']
  private readonly edges: WorkbenchDependency[]

  constructor(phase: WorkbenchDependency['phase'], dependencies: WorkbenchDependency[]) {
    this.phase = phase
    this.edges = dependencies
      .filter((dependency) => dependency.phase === phase)
      .map((dependency) => structuredClone(dependency))
  }

  dependencies(): WorkbenchDependency[] {
    return structuredClone(this.edges)
  }

  prerequisites(instanceId: string): WorkbenchDependency[] {
    return this.edges
      .filter(({ afterInstanceId, blocking }) => blocking && afterInstanceId === instanceId)
      .map((dependency) => structuredClone(dependency))
  }

  unmet(instanceId: string, parts: ReadonlyMap<string, WorkbenchPart>): WorkbenchDependency[] {
    return this.prerequisites(instanceId).filter(({ beforeInstanceId }) => {
      const state = parts.get(beforeInstanceId)?.state
      return this.phase === 'disassembly'
        ? !['removed', 'placed-in-tray', 'ready-to-install'].includes(state ?? 'unknown')
        : !['installed', 'exposed', 'inspected', 'installed-unverified', 'installed-verified'].includes(state ?? 'unknown')
    })
  }

  diagnoseCycles(): WorkbenchDiagnostic[] {
    const adjacency = new Map<string, string[]>()
    this.edges.filter(({ blocking }) => blocking).forEach(({ beforeInstanceId, afterInstanceId }) => {
      adjacency.set(beforeInstanceId, [...(adjacency.get(beforeInstanceId) ?? []), afterInstanceId])
    })
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const diagnostics: WorkbenchDiagnostic[] = []
    const visit = (id: string, path: string[]) => {
      if (visiting.has(id)) {
        diagnostics.push({
          code: 'WB-DEPENDENCY-CYCLE',
          message: `Ciclo ${this.phase}: ${[...path, id].join(' → ')}.`,
          blocking: true,
          instanceId: id,
        })
        return
      }
      if (visited.has(id)) return
      visiting.add(id)
      for (const next of adjacency.get(id) ?? []) visit(next, [...path, id])
      visiting.delete(id)
      visited.add(id)
    }
    for (const id of adjacency.keys()) visit(id, [])
    return diagnostics
  }
}
