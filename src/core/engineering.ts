import { evaluateProject, type ProjectEvaluation } from '../vnext/engine'
import { calculateMechanicalDynamics, type DynamicsMetrics } from './dynamics'
import { calculateAutomaticWinding, type AutomaticWindingAnalysis } from './automatic'
import { calculateEscapement, type EscapementAnalysis } from './escapement'
import { solveAssemblyConstraints, type AssemblyConstraintSolution } from './constraints'
import { analyzeManufacturing, type ManufacturingAnalysis } from './manufacturing'
import { runToleranceAnalysis, type ToleranceAnalysis } from './tolerance'
import type { WatchProject } from '../vnext/model'

export type SolverLayer = 'geometry' | 'assembly' | 'kinematics' | 'dynamics' | 'tolerances' | 'manufacturing'
export type SolverState = 'pass' | 'warning' | 'fail' | 'pending' | 'not_applicable'

export interface SolverLayerResult {
  layer: SolverLayer
  label: string
  state: SolverState
  confidence: 'high' | 'medium' | 'low' | 'pending'
  summary: string
  issueCount: number
  backend: 'preview' | 'exact' | 'analytical'
}

export interface EngineeringReport {
  generatedAt: string
  projectId: string
  layers: SolverLayerResult[]
  geometry: ProjectEvaluation
  assembly: AssemblyConstraintSolution
  tolerances: ToleranceAnalysis
  manufacturing: ManufacturingAnalysis
  dynamics: DynamicsMetrics | null
  automaticWinding: AutomaticWindingAnalysis | null
  escapement: EscapementAnalysis | null
  overall: SolverState
}

function stateRank(state: SolverState): number {
  if (state === 'fail') return 4
  if (state === 'warning') return 3
  if (state === 'pending') return 2
  if (state === 'pass') return 1
  return 0
}

function geometryState(evaluation: ProjectEvaluation): SolverState {
  if (evaluation.status === 'MAL') return 'fail'
  if (evaluation.status === 'JUSTO') return 'warning'
  if (evaluation.status === 'PARCIAL') return 'pending'
  return 'pass'
}

export function evaluateEngineeringProject(project: WatchProject, toleranceSamples?: number): EngineeringReport {
  const geometry = evaluateProject(project)
  const assembly = solveAssemblyConstraints(project)
  const tolerances = runToleranceAnalysis(project, toleranceSamples)
  const manufacturing = analyzeManufacturing(project)
  const dynamics = project.movement.kind === 'mechanical' && geometry.train
    ? calculateMechanicalDynamics(project.movement, geometry.train)
    : null
  const escapement = project.movement.kind === 'mechanical' && geometry.train
    ? calculateEscapement(project.movement, geometry.train)
    : null
  const automaticWinding = project.movement.kind === 'mechanical' && geometry.train && dynamics
    ? calculateAutomaticWinding(project.movement, geometry.train, dynamics)
    : null
  const geometryErrors = geometry.findings.filter((finding) => finding.severity === 'error').length
  const geometryWarnings = geometry.findings.filter((finding) => finding.severity === 'warning').length
  const trainErrors = geometry.train?.findings.filter((finding) => finding.severity === 'error').length ?? 0
  const trainWarnings = geometry.train?.findings.filter((finding) => finding.severity === 'warning').length ?? 0
  const dynamicErrors = (dynamics?.issues.filter((issue) => issue.severity === 'error').length ?? 0)
    + (escapement?.issues.filter((issue) => issue.severity === 'error').length ?? 0)
    + (automaticWinding?.issues.filter((issue) => issue.severity === 'error').length ?? 0)
  const dynamicWarnings = (dynamics?.issues.filter((issue) => issue.severity === 'warning').length ?? 0)
    + (escapement?.issues.filter((issue) => issue.severity === 'warning').length ?? 0)
    + (automaticWinding?.issues.filter((issue) => issue.severity === 'warning').length ?? 0)
  const manufacturingErrors = manufacturing.checks.filter((check) => check.severity === 'error').length
  const manufacturingWarnings = manufacturing.checks.filter((check) => check.severity === 'warning').length
  const toleranceState: SolverState = project.engineering.toleranceMode === 'nominal'
    ? tolerances.nominalPass ? 'pass' : 'fail'
    : project.engineering.toleranceMode === 'worst_case'
      ? !tolerances.nominalPass ? 'fail' : tolerances.worstCasePass ? 'pass' : 'warning'
      : tolerances.yieldProbability < 0.8 ? 'fail' : tolerances.yieldProbability < 0.99 ? 'warning' : 'pass'
  const toleranceSummary = project.engineering.toleranceMode === 'nominal'
    ? tolerances.nominalPass ? 'Nominal dentro de limites' : 'Nominal fuera de limites'
    : project.engineering.toleranceMode === 'worst_case'
      ? tolerances.worstCasePass ? 'Peor caso dentro de limites' : 'Nominal viable; peor caso requiere ajuste'
      : `${(tolerances.yieldProbability * 100).toFixed(1)}% de montajes validos`
  const layers: SolverLayerResult[] = [
    {
      layer: 'geometry',
      label: 'Geometria',
      state: geometryState(geometry),
      confidence: project.engineering.solverMode === 'exact' ? 'high' : 'medium',
      summary: geometryErrors > 0 ? `${geometryErrors} colisiones o incompatibilidades` : geometryWarnings > 0 ? `${geometryWarnings} margenes justos` : 'Envolventes sin conflicto nominal',
      issueCount: geometryErrors + geometryWarnings,
      backend: project.engineering.solverMode,
    },
    {
      layer: 'assembly',
      label: 'Montaje',
      state: assembly.failedConstraints.length > 0 ? 'fail' : assembly.unresolvedParts.length > 0 ? 'warning' : 'pass',
      confidence: 'medium',
      summary: assembly.failedConstraints.length > 0
        ? `${assembly.failedConstraints.length} restricciones incumplidas`
        : assembly.unresolvedParts.length > 0
          ? `${assembly.unresolvedParts.length} piezas conservan grados de libertad`
          : 'Montaje completamente restringido',
      issueCount: assembly.failedConstraints.length + assembly.unresolvedParts.length,
      backend: 'analytical',
    },
    {
      layer: 'kinematics',
      label: 'Cinematica',
      state: project.movement.kind === 'quartz' ? 'not_applicable' : trainErrors > 0 ? 'fail' : trainWarnings > 0 ? 'warning' : 'pass',
      confidence: project.movement.kind === 'quartz' ? 'high' : 'medium',
      summary: project.movement.kind === 'quartz'
        ? 'Gestionada por el calibre comercial'
        : trainErrors > 0
          ? `${trainErrors} fallos de tren o engrane`
          : `${Math.round(geometry.train?.calculatedVph ?? 0).toLocaleString('es-ES')} vph`,
      issueCount: trainErrors + trainWarnings,
      backend: 'analytical',
    },
    {
      layer: 'dynamics',
      label: 'Dinamica',
      state: !dynamics ? 'not_applicable' : dynamicErrors > 0 ? 'fail' : dynamicWarnings > 0 ? 'warning' : dynamics.confidence === 'pending' || dynamics.confidence === 'low' ? 'pending' : 'pass',
      confidence: dynamics?.confidence ?? 'high',
      summary: !dynamics
        ? 'No aplicable al movimiento de cuarzo encapsulado'
        : `${dynamics.minimumEnergyMargin.toFixed(2)}x margen energetico minimo`,
      issueCount: dynamicErrors + dynamicWarnings,
      backend: 'analytical',
    },
    {
      layer: 'tolerances',
      label: 'Tolerancias',
      state: toleranceState,
      confidence: project.engineering.toleranceMode === 'monte_carlo' ? 'medium' : 'high',
      summary: toleranceSummary,
      issueCount: tolerances.metrics.filter((metric) => metric.failureProbability > 0).length,
      backend: 'analytical',
    },
    {
      layer: 'manufacturing',
      label: 'Fabricacion',
      state: project.engineering.manufacturingProcess === 'none'
        ? 'pending'
        : manufacturingErrors > 0 ? 'fail' : manufacturingWarnings > 0 ? 'warning' : manufacturing.exactCadRequired ? 'pending' : 'pass',
      confidence: manufacturing.exactCadRequired ? 'pending' : 'medium',
      summary: project.engineering.manufacturingProcess === 'none'
        ? 'Selecciona un proceso objetivo'
        : manufacturingErrors > 0 ? `${manufacturingErrors} limites de proceso incumplidos` : manufacturing.profile.name,
      issueCount: project.engineering.manufacturingProcess === 'none' ? 0 : manufacturingErrors + manufacturingWarnings,
      backend: 'preview',
    },
  ]
  const applicable = layers.filter((layer) => layer.state !== 'not_applicable')
  const overall = applicable.reduce<SolverState>((worst, layer) => stateRank(layer.state) > stateRank(worst) ? layer.state : worst, 'pass')

  return {
    generatedAt: new Date().toISOString(),
    projectId: project.id,
    layers,
    geometry,
    assembly,
    tolerances,
    manufacturing,
    dynamics,
    automaticWinding,
    escapement,
    overall,
  }
}
