import type {
  FixtureLoadRecord,
  LoadedEducationalFixtureMount,
  VisualDiagnostic,
  VisualPerformanceBudget,
  VisualPerformanceMetrics,
  VisualPerformanceReport,
} from './model'
import type { EducationalVisualState } from './model'
import { visualMaterialFor } from './visualLanguage'

export const DEFAULT_VISUAL_PERFORMANCE_BUDGET: VisualPerformanceBudget = {
  maxMountedFixtures: 4,
  maxLogicalEntities: 160,
  maxRenderablePrimitives: 180,
  maxEstimatedDrawCalls: 220,
  maxMaterialVariants: 48,
  maxActiveOverlays: 80,
  maxVisibleLabels: 36,
  maxEstimatedGeometryBytes: 24 * 1024 * 1024,
  maxMountLoadMs: 800,
}

const VERTICES_BY_SHAPE: Record<string, number> = {
  disc: 192,
  ring: 256,
  box: 24,
  rod: 96,
  coil: 320,
  spiral: 320,
  bridge: 180,
  wheel: 384,
  screw: 160,
  'symbolic-marker': 48,
}

function primitiveKey(primitive: LoadedEducationalFixtureMount['sceneGraph']['entities'][number]['primitives'][number]): string {
  return `${primitive.shape}:${primitive.size.map((value) => value.toFixed(5)).join(',')}:${primitive.provenanceClass}`
}

function budgetDiagnostic(
  code: string,
  label: string,
  value: number,
  limit: number,
): VisualDiagnostic {
  return {
    code,
    severity: 'warning',
    message: `${label}: ${value}; presupuesto ${limit}.`,
    accessibleMessage: `${label} supera el presupuesto de rendimiento: ${value} frente a ${limit}.`,
  }
}

export function collectVisualPerformance(
  mounted: LoadedEducationalFixtureMount[],
  state: EducationalVisualState,
  loadRecords: FixtureLoadRecord[],
  budget: VisualPerformanceBudget = DEFAULT_VISUAL_PERFORMANCE_BUDGET,
  measuredAt = new Date().toISOString(),
): VisualPerformanceReport {
  const entities = mounted.flatMap(({ sceneGraph }) => sceneGraph.entities)
  const primitives = entities.flatMap(({ primitives: values }) => values)
  const reuseGroups = new Map<string, typeof primitives>()
  primitives.forEach((primitive) => {
    const key = primitiveKey(primitive)
    reuseGroups.set(key, [...(reuseGroups.get(key) ?? []), primitive])
  })
  const safeInstanceGroups = [...reuseGroups.values()].filter((group) =>
    group.length > 1
    && group.every(({ shape }) => shape === group[0].shape)
    && new Set(group.map(({ provenanceClass }) => provenanceClass)).size === 1)
  const materialVariants = new Set(entities.map((entity) => {
    const material = visualMaterialFor(entity.subsystem, entity.provenanceClass)
    return `${material.subsystem}:${material.provenance}:${material.pattern}:${material.outline}`
  })).size
  const activeOverlays = state.overlays.filter(({ state: overlayState }) => overlayState !== 'hidden')
  const overlayDrawCalls = activeOverlays.reduce((sum, overlay) => {
    if (overlay.kind === 'arrow') return sum + 2
    if (overlay.kind === 'rotation-arc') return sum + 1
    if (overlay.kind === 'energy-path') return sum + overlay.segments.length
    return sum
  }, 0)
  const mountLoadMs = Object.fromEntries(mounted.map(({ spec }) => {
    const latest = [...loadRecords].reverse().find(({ fixtureId, fixtureVersion, fromCache }) =>
      fixtureId === spec.fixtureId && fixtureVersion === spec.fixtureVersion && !fromCache)
    return [spec.id, latest?.durationMs ?? 0]
  }))
  const estimatedGeometryBytes = primitives.reduce((sum, primitive) =>
    sum + (VERTICES_BY_SHAPE[primitive.shape] ?? 128) * 8 * 4, 0)
  const metrics: VisualPerformanceMetrics = {
    mountedFixtures: mounted.length,
    logicalEntities: entities.length,
    renderablePrimitives: primitives.length,
    geometryReuseGroups: [...reuseGroups.values()].filter(({ length }) => length > 1).length,
    safeInstanceGroups: safeInstanceGroups.length,
    estimatedDrawCalls: primitives.length + overlayDrawCalls,
    materialVariants,
    activeOverlays: activeOverlays.length,
    visibleLabels: activeOverlays.filter(({ kind }) => kind === 'label').length,
    estimatedGeometryBytes,
    mountLoadMs,
  }
  const diagnostics: VisualDiagnostic[] = []
  if (metrics.mountedFixtures > budget.maxMountedFixtures) diagnostics.push(budgetDiagnostic('EV-PERF-MOUNTS', 'Monturas', metrics.mountedFixtures, budget.maxMountedFixtures))
  if (metrics.logicalEntities > budget.maxLogicalEntities) diagnostics.push(budgetDiagnostic('EV-PERF-ENTITIES', 'Entidades lógicas', metrics.logicalEntities, budget.maxLogicalEntities))
  if (metrics.renderablePrimitives > budget.maxRenderablePrimitives) diagnostics.push(budgetDiagnostic('EV-PERF-PRIMITIVES', 'Primitivas', metrics.renderablePrimitives, budget.maxRenderablePrimitives))
  if (metrics.estimatedDrawCalls > budget.maxEstimatedDrawCalls) diagnostics.push(budgetDiagnostic('EV-PERF-DRAW-CALLS', 'Draw calls estimadas', metrics.estimatedDrawCalls, budget.maxEstimatedDrawCalls))
  if (metrics.materialVariants > budget.maxMaterialVariants) diagnostics.push(budgetDiagnostic('EV-PERF-MATERIALS', 'Variantes de material', metrics.materialVariants, budget.maxMaterialVariants))
  if (metrics.activeOverlays > budget.maxActiveOverlays) diagnostics.push(budgetDiagnostic('EV-PERF-OVERLAYS', 'Overlays activos', metrics.activeOverlays, budget.maxActiveOverlays))
  if (metrics.visibleLabels > budget.maxVisibleLabels) diagnostics.push(budgetDiagnostic('EV-PERF-LABELS', 'Etiquetas visibles', metrics.visibleLabels, budget.maxVisibleLabels))
  if (metrics.estimatedGeometryBytes > budget.maxEstimatedGeometryBytes) diagnostics.push(budgetDiagnostic('EV-PERF-MEMORY', 'Memoria geométrica estimada', metrics.estimatedGeometryBytes, budget.maxEstimatedGeometryBytes))
  Object.entries(metrics.mountLoadMs).forEach(([mountId, durationMs]) => {
    if (durationMs > budget.maxMountLoadMs) diagnostics.push(budgetDiagnostic('EV-PERF-LOAD', `Carga de ${mountId}`, durationMs, budget.maxMountLoadMs))
  })
  return {
    metrics,
    budget: structuredClone(budget),
    diagnostics,
    withinBudget: diagnostics.length === 0,
    measuredAt,
    measurementKind: 'logical-estimate',
  }
}
