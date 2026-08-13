import { analyzeGearPair, gearInputFromArbor } from './gears'
import { valueOf, type Reliability, type WatchPartId, type WatchProject } from '../vnext/model'

export interface ManufacturingProfile {
  id: string
  name: string
  process: Exclude<WatchProject['engineering']['manufacturingProcess'], 'none'>
  xyResolution: number
  zResolution: number
  minimumWall: number
  minimumFeature: number
  minimumHole: number
  runningClearance: number
  pressFitInterference: number
  maximumUnsupportedAngle: number
  shrinkPercent: number
}

export interface ManufacturingCheck {
  id: string
  part: WatchPartId
  severity: 'error' | 'warning' | 'info'
  title: string
  detail: string
  actual?: number
  required?: number
  reliability: Reliability
}

export interface ManufacturingAnalysis {
  profile: ManufacturingProfile
  processDefined: boolean
  checks: ManufacturingCheck[]
  printableParts: WatchPartId[]
  blockedParts: WatchPartId[]
  exactCadRequired: boolean
  readyForExport: boolean
}

export const MANUFACTURING_PROFILES: ManufacturingProfile[] = [
  {
    id: 'resin-50um-engineering',
    name: 'Resina tecnica 50 um',
    process: 'resin',
    xyResolution: 0.05,
    zResolution: 0.05,
    minimumWall: 0.45,
    minimumFeature: 0.18,
    minimumHole: 0.45,
    runningClearance: 0.15,
    pressFitInterference: 0.04,
    maximumUnsupportedAngle: 45,
    shrinkPercent: 0.6,
  },
  {
    id: 'fdm-020-detail',
    name: 'FDM detalle 0,20 mm',
    process: 'fdm',
    xyResolution: 0.2,
    zResolution: 0.12,
    minimumWall: 0.8,
    minimumFeature: 0.45,
    minimumHole: 1.2,
    runningClearance: 0.3,
    pressFitInterference: 0.12,
    maximumUnsupportedAngle: 50,
    shrinkPercent: 0.4,
  },
  {
    id: 'cnc-micro-watch',
    name: 'CNC microfresado',
    process: 'cnc',
    xyResolution: 0.015,
    zResolution: 0.01,
    minimumWall: 0.25,
    minimumFeature: 0.12,
    minimumHole: 0.3,
    runningClearance: 0.04,
    pressFitInterference: 0.01,
    maximumUnsupportedAngle: 90,
    shrinkPercent: 0,
  },
  {
    id: 'laser-sheet-010',
    name: 'Laser chapa fina',
    process: 'laser',
    xyResolution: 0.1,
    zResolution: 0.05,
    minimumWall: 0.2,
    minimumFeature: 0.2,
    minimumHole: 0.35,
    runningClearance: 0.12,
    pressFitInterference: 0.03,
    maximumUnsupportedAngle: 90,
    shrinkPercent: 0,
  },
]

function profileForProject(project: WatchProject): ManufacturingProfile {
  const selected = MANUFACTURING_PROFILES.find((profile) => profile.id === project.engineering.printerProfileId)
  if (selected) return selected
  const process = project.engineering.manufacturingProcess === 'none' ? 'resin' : project.engineering.manufacturingProcess
  return MANUFACTURING_PROFILES.find((profile) => profile.process === process) ?? MANUFACTURING_PROFILES[0]
}

function checkMinimum(
  checks: ManufacturingCheck[],
  id: string,
  part: WatchPartId,
  label: string,
  actual: number,
  required: number,
  reliability: Reliability = 'medium',
): void {
  if (actual < required) {
    checks.push({
      id,
      part,
      severity: 'error',
      title: `${label} por debajo del proceso`,
      detail: `${actual.toFixed(3)} mm disponibles; el perfil requiere ${required.toFixed(3)} mm.`,
      actual,
      required,
      reliability,
    })
  } else if (actual < required * 1.35) {
    checks.push({
      id: `${id}-tight`,
      part,
      severity: 'warning',
      title: `${label} en el limite del proceso`,
      detail: `${actual.toFixed(3)} mm disponibles frente a ${required.toFixed(3)} mm recomendados.`,
      actual,
      required,
      reliability,
    })
  }
}

export function analyzeManufacturing(project: WatchProject): ManufacturingAnalysis {
  const profile = profileForProject(project)
  const processDefined = project.engineering.manufacturingProcess !== 'none'
  const checks: ManufacturingCheck[] = []
  const dialFloor = valueOf(project.dial.thickness) - (project.dial.recess.enabled ? valueOf(project.dial.recess.depth) : 0)
  checkMinimum(checks, 'case-wall', 'case', 'Pared de caja', valueOf(project.case.wallThickness), profile.minimumWall)
  checkMinimum(checks, 'dial-floor', 'dial', 'Suelo del dial', dialFloor, profile.minimumWall)
  checkMinimum(checks, 'dial-hole', 'dial', 'Agujero central del dial', valueOf(project.dial.centerHole), profile.minimumHole)

  project.dial.reliefs.forEach((relief) => {
    checkMinimum(checks, `relief-${relief.id}`, 'dial', `Detalle ${relief.name}`, Math.min(valueOf(relief.width), valueOf(relief.length)), profile.minimumFeature, 'low')
  })

  const printableParts: WatchPartId[] = ['case', 'back', 'dial', 'holder']
  if (project.movement.kind === 'mechanical') {
    const movement = project.movement
    printableParts.push('plate', 'bridge', 'barrel', 'center', 'third', 'fourth', 'escape')
    checkMinimum(checks, 'plate-wall', 'plate', 'Espesor de platina', valueOf(movement.plateThickness), profile.minimumWall)
    checkMinimum(checks, 'bridge-wall', 'bridge', 'Espesor de puente', valueOf(movement.bridgeThickness), profile.minimumWall)
    movement.arbors.forEach((arbor, index) => {
      const toothFeature = valueOf(arbor.moduleToNext) * Math.PI / 2
      checkMinimum(checks, `gear-feature-${arbor.id}`, arbor.id, `Espesor circular de diente en ${arbor.name}`, toothFeature, profile.minimumFeature, 'medium')
      checkMinimum(checks, `pivot-${arbor.id}`, arbor.id, `Diametro de pivote en ${arbor.name}`, valueOf(arbor.pivotDiameter), profile.minimumFeature, 'medium')
      if (index < movement.arbors.length - 1 && (arbor.profileToNext ?? 'cycloidal') === 'involute') {
        const driven = movement.arbors[index + 1]
        const pair = analyzeGearPair(
          gearInputFromArbor(arbor),
          { ...gearInputFromArbor(driven, true), module: valueOf(arbor.moduleToNext) },
        )
        if (pair.driver.undercutRisk || pair.driven.undercutRisk) {
          checks.push({
            id: `gear-undercut-${arbor.id}`,
            part: driven.id,
            severity: 'warning',
            title: `Perfil de ${driven.name} requiere verificacion`,
            detail: 'El recuento de hojas y el desplazamiento de perfil producen riesgo teorico de socavado.',
            reliability: 'medium',
          })
        }
      }
    })
    if (movement.architecture === 'automatic' && movement.automatic) {
      printableParts.push('rotor')
      checkMinimum(checks, 'rotor-thickness', 'rotor', 'Espesor del rotor', valueOf(movement.automatic.rotorThickness), profile.minimumWall, 'medium')
      checkMinimum(checks, 'rotor-bearing', 'rotor', 'Alojamiento del cojinete', valueOf(movement.automatic.bearingDiameter), profile.minimumHole, 'medium')
    }
  }

  if (profile.process === 'fdm') {
    checks.push({
      id: 'fdm-watch-scale',
      part: 'movement',
      severity: 'warning',
      title: 'FDM no resuelve la mayor parte del movimiento',
      detail: 'El perfil puede servir para maquetas de caja y holders, pero pivotes, rubies y dentado requieren otro proceso.',
      reliability: 'high',
    })
  }

  checks.push({
    id: 'exact-mesh-pending',
    part: 'case',
    severity: 'info',
    title: 'Comprobacion topologica en el nucleo CAD',
    detail: 'Watertight, normales, auto-intersecciones, volumen y radios de herramienta se verifican sobre el solido exacto antes de exportar.',
    reliability: 'pending',
  })

  const blockedParts = [...new Set(checks.filter((check) => check.severity === 'error').map((check) => check.part))]
  return {
    profile,
    processDefined,
    checks,
    printableParts,
    blockedParts,
    exactCadRequired: true,
    readyForExport: processDefined && blockedParts.length === 0,
  }
}
