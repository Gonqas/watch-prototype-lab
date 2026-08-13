import type {
  CalibreDependency,
  CalibreDependencyGraphKind,
} from './model'

export class CalibreDependencyGraph {
  readonly kind: CalibreDependencyGraphKind
  private readonly edgesValue: CalibreDependency[]

  constructor(kind: CalibreDependencyGraphKind, dependencies: CalibreDependency[]) {
    this.kind = kind
    this.edgesValue = dependencies
      .filter((dependency) => dependency.graph === kind)
      .map((dependency) => structuredClone(dependency))
  }

  edges(): CalibreDependency[] {
    return structuredClone(this.edgesValue)
  }

  incoming(instanceId: string): CalibreDependency[] {
    return this.edgesValue.filter(({ toInstanceId }) => toInstanceId === instanceId).map((edge) => structuredClone(edge))
  }

  outgoing(instanceId: string): CalibreDependency[] {
    return this.edgesValue.filter(({ fromInstanceId }) => fromInstanceId === instanceId).map((edge) => structuredClone(edge))
  }

  diagnoseCycles(): Array<{ code: string; graph: CalibreDependencyGraphKind; path: string[] }> {
    const adjacency = new Map<string, string[]>()
    this.edgesValue.filter(({ blocking }) => blocking).forEach(({ fromInstanceId, toInstanceId }) => {
      adjacency.set(fromInstanceId, [...(adjacency.get(fromInstanceId) ?? []), toInstanceId])
    })
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const diagnostics: Array<{ code: string; graph: CalibreDependencyGraphKind; path: string[] }> = []
    const visit = (id: string, path: string[]) => {
      if (visiting.has(id)) {
        diagnostics.push({ code: 'CALIBRE-DEPENDENCY-CYCLE', graph: this.kind, path: [...path, id] })
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
