import { diagnostic, type RuntimeDiagnostic } from './diagnostics'
import { compareSemVer, satisfiesSemVerRange } from './semver'

export type CapabilityStatus = 'available' | 'unavailable' | 'limited' | 'unknown'

export interface RuntimeCapability {
  id: string
  version: string
  status: CapabilityStatus
  explanation: string
  limitations: string[]
}

export interface CapabilityRequirement {
  id: string
  versionRange: string
  optional: boolean
  allowLimited: boolean
}

export interface CapabilityResolution {
  requirement: CapabilityRequirement
  capability?: RuntimeCapability
  satisfied: boolean
  diagnostic?: RuntimeDiagnostic
}

export function parseCapabilityRequirement(value: string | CapabilityRequirement): CapabilityRequirement {
  if (typeof value !== 'string') return value
  const separator = value.lastIndexOf('@')
  if (separator > 0) return { id: value.slice(0, separator), versionRange: value.slice(separator + 1), optional: false, allowLimited: false }
  return { id: value, versionRange: '*', optional: false, allowLimited: false }
}

export class CapabilityResolver {
  private readonly capabilities = new Map<string, RuntimeCapability[]>()

  constructor(capabilities: RuntimeCapability[] = []) {
    capabilities.forEach((capability) => this.register(capability))
  }

  register(capability: RuntimeCapability): void {
    const versions = this.capabilities.get(capability.id) ?? []
    const existing = versions.findIndex(({ version }) => version === capability.version)
    if (existing >= 0) versions[existing] = structuredClone(capability)
    else versions.push(structuredClone(capability))
    versions.sort((left, right) => compareSemVer(right.version, left.version))
    this.capabilities.set(capability.id, versions)
  }

  list(): RuntimeCapability[] {
    return [...this.capabilities.values()].flat().map((item) => structuredClone(item))
  }

  resolve(input: string | CapabilityRequirement): CapabilityResolution {
    const requirement = parseCapabilityRequirement(input)
    const capability = (this.capabilities.get(requirement.id) ?? [])
      .find(({ version }) => satisfiesSemVerRange(version, requirement.versionRange))
    const statusAllowed = capability?.status === 'available' || (requirement.allowLimited && capability?.status === 'limited')
    const satisfied = requirement.optional || statusAllowed
    if (satisfied) return { requirement, capability, satisfied }
    const reason = capability
      ? `La capacidad ${requirement.id} está ${capability.status}: ${capability.explanation}`
      : `No existe ${requirement.id} compatible con ${requirement.versionRange}.`
    return {
      requirement,
      capability,
      satisfied,
      diagnostic: diagnostic({
        code: capability ? 'LR-CAPABILITY-UNAVAILABLE' : 'LR-CAPABILITY-MISSING',
        category: 'capability-missing',
        message: reason,
        technicalDetail: capability?.limitations.join('; '),
        source: 'compiler',
        suggestedRecovery: requirement.optional ? 'Continuar sin esta capacidad.' : 'Instalar o habilitar una capacidad compatible.',
        severity: requirement.optional ? 'warning' : 'error',
        blocking: !requirement.optional,
        retrySafe: true,
      }),
    }
  }

  resolveAll(requirements: Array<string | CapabilityRequirement>): CapabilityResolution[] {
    return requirements.map((requirement) => this.resolve(requirement))
  }
}

export const HEADLESS_RUNTIME_CAPABILITIES: RuntimeCapability[] = [
  { id: 'learning.content', version: '1.0.0', status: 'available', explanation: 'Carga declarativa v1.', limitations: [] },
  { id: 'learning.scene-runtime', version: '1.0.0', status: 'available', explanation: 'Runtime determinista de escenas.', limitations: [] },
  { id: 'canonical-selectors-v1', version: '1.0.0', status: 'available', explanation: 'Alias de compatibilidad para selectores canónicos.', limitations: [] },
  { id: 'timeline.scrub', version: '1.0.0', status: 'available', explanation: 'Timeline evaluable y scrubbing determinista.', limitations: [] },
  { id: 'reduced-motion', version: '1.0.0', status: 'available', explanation: 'Normalización de animaciones no esenciales.', limitations: [] },
]
