import { evaluateEngineeringProject, type EngineeringReport } from './engineering'
import type { WatchProject } from '../vnext/model'

const reportCache = new WeakMap<WatchProject, EngineeringReport>()

export function getInteractiveEngineeringReport(project: WatchProject): EngineeringReport {
  const cached = reportCache.get(project)
  if (cached) return cached
  const samples = project.engineering.toleranceMode === 'monte_carlo'
    ? Math.min(800, project.engineering.monteCarloSamples)
    : undefined
  const report = evaluateEngineeringProject(project, samples)
  reportCache.set(project, report)
  return report
}
