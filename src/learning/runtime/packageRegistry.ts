import type { LoadedLearningPackage } from './packageLoader'
import { diagnostic, hasBlockingDiagnostics, type RuntimeDiagnostic } from './diagnostics'
import { compareSemVer, satisfiesSemVerRange } from './semver'

export interface PackageRegistrationResult {
  registered: boolean
  diagnostics: RuntimeDiagnostic[]
}

export interface ResolvedPackageGraph {
  root: LoadedLearningPackage
  pinned: ReadonlyMap<string, LoadedLearningPackage>
  diagnostics: RuntimeDiagnostic[]
}

export class LearningPackageRegistry {
  private readonly packages = new Map<string, Map<string, LoadedLearningPackage>>()

  register(packageToRegister: LoadedLearningPackage): PackageRegistrationResult {
    const { id, packageVersion } = packageToRegister.pack.manifest
    const versions = this.packages.get(id) ?? new Map<string, LoadedLearningPackage>()
    const existing = versions.get(packageVersion)
    if (existing) {
      if (existing.packageFingerprint === packageToRegister.packageFingerprint) return { registered: false, diagnostics: [] }
      return {
        registered: false,
        diagnostics: [diagnostic({
          code: 'LR-REGISTRY-VERSION-COLLISION', category: 'package-error', severity: 'error',
          message: `Colisión para ${id}@${packageVersion}.`,
          technicalDetail: `${existing.packageFingerprint} != ${packageToRegister.packageFingerprint}`,
          source: 'registry', packageId: id, packageVersion,
          suggestedRecovery: 'Cambiar la versión del paquete o retirar la copia conflictiva.', blocking: true, retrySafe: false,
        })],
      }
    }
    versions.set(packageVersion, packageToRegister)
    this.packages.set(id, versions)
    return { registered: true, diagnostics: [] }
  }

  unregister(id: string, version: string): boolean {
    const versions = this.packages.get(id)
    if (!versions) return false
    const removed = versions.delete(version)
    if (versions.size === 0) this.packages.delete(id)
    return removed
  }

  list(id?: string): LoadedLearningPackage[] {
    const values = id ? [...(this.packages.get(id)?.values() ?? [])] : [...this.packages.values()].flatMap((versions) => [...versions.values()])
    return values.sort((left, right) => left.pack.manifest.id.localeCompare(right.pack.manifest.id)
      || compareSemVer(right.pack.manifest.packageVersion, left.pack.manifest.packageVersion))
  }

  select(id: string, range = '*'): LoadedLearningPackage | undefined {
    return [...(this.packages.get(id)?.values() ?? [])]
      .filter(({ pack }) => satisfiesSemVerRange(pack.manifest.packageVersion, range))
      .sort((left, right) => compareSemVer(right.pack.manifest.packageVersion, left.pack.manifest.packageVersion)
        || originRank(right.origin) - originRank(left.origin))[0]
  }

  resolveForSession(id: string, range = '*'): ResolvedPackageGraph | null {
    const diagnostics: RuntimeDiagnostic[] = []
    const root = this.select(id, range)
    if (!root) return null
    const pinned = new Map<string, LoadedLearningPackage>()
    const visiting: string[] = []
    const visit = (current: LoadedLearningPackage): void => {
      const key = `${current.pack.manifest.id}@${current.pack.manifest.packageVersion}`
      const cycleStart = visiting.indexOf(key)
      if (cycleStart >= 0) {
        diagnostics.push(diagnostic({
          code: 'LR-REGISTRY-DEPENDENCY-CYCLE', category: 'content-error', severity: 'error',
          message: `Dependencia circular: ${[...visiting.slice(cycleStart), key].join(' → ')}.`, source: 'registry',
          packageId: current.pack.manifest.id, packageVersion: current.pack.manifest.packageVersion,
          suggestedRecovery: 'Eliminar el ciclo en los manifiestos.', blocking: true, retrySafe: true,
        }))
        return
      }
      const already = pinned.get(current.pack.manifest.id)
      if (already) {
        if (already.pack.manifest.packageVersion !== current.pack.manifest.packageVersion) {
          diagnostics.push(diagnostic({
            code: 'LR-REGISTRY-DEPENDENCY-CONFLICT', category: 'content-error', severity: 'error',
            message: `La sesión requiere versiones incompatibles de ${current.pack.manifest.id}.`, source: 'registry',
            packageId: current.pack.manifest.id, suggestedRecovery: 'Alinear los rangos de dependencia.', blocking: true, retrySafe: true,
          }))
        }
        return
      }
      pinned.set(current.pack.manifest.id, current)
      visiting.push(key)
      for (const dependency of current.pack.manifest.dependencies) {
        const resolved = this.select(dependency.packageId, dependency.versionRange)
        if (!resolved) {
          diagnostics.push(diagnostic({
            code: 'LR-REGISTRY-DEPENDENCY-MISSING', category: 'content-error', severity: 'error',
            message: `Falta ${dependency.packageId}@${dependency.versionRange}.`, source: 'registry',
            packageId: current.pack.manifest.id, packageVersion: current.pack.manifest.packageVersion,
            suggestedRecovery: 'Cargar una versión compatible de la dependencia.', blocking: true, retrySafe: true,
          }))
          continue
        }
        visit(resolved)
      }
      visiting.pop()
    }
    visit(root)
    if (hasBlockingDiagnostics(diagnostics)) return { root, pinned, diagnostics }
    return { root, pinned, diagnostics }
  }
}

function originRank(origin: LoadedLearningPackage['origin']): number {
  return origin === 'integrated' ? 2 : 1
}
