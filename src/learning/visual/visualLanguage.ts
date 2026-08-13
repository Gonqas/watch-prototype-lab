import type {
  VisualMaterialDescriptor,
  VisualProvenanceClass,
} from './model'

const SUBSYSTEM_LANGUAGE: Record<string, {
  color: string
  pattern: VisualMaterialDescriptor['pattern']
  icon: string
  roughness: number
  metalness: number
}> = {
  'power-source': { color: '#d4b85d', pattern: 'solid', icon: 'battery', roughness: 0.42, metalness: 0.35 },
  regulation: { color: '#d57b76', pattern: 'dotted', icon: 'activity', roughness: 0.28, metalness: 0.62 },
  escapement: { color: '#c9708a', pattern: 'crosshatched', icon: 'step-forward', roughness: 0.3, metalness: 0.68 },
  train: { color: '#d7a441', pattern: 'dashed', icon: 'settings', roughness: 0.26, metalness: 0.76 },
  indication: { color: '#e8e3d6', pattern: 'solid', icon: 'clock', roughness: 0.24, metalness: 0.7 },
  'electronic-control': { color: '#55a58a', pattern: 'hatched', icon: 'microchip', roughness: 0.5, metalness: 0.2 },
  motor: { color: '#c87654', pattern: 'crosshatched', icon: 'magnet', roughness: 0.38, metalness: 0.5 },
  structure: { color: '#909ba1', pattern: 'dotted', icon: 'layers', roughness: 0.44, metalness: 0.7 },
  keyless: { color: '#7f99ad', pattern: 'dashed', icon: 'key-round', roughness: 0.35, metalness: 0.72 },
  'motion-works': { color: '#cfc078', pattern: 'dashed', icon: 'clock-3', roughness: 0.3, metalness: 0.74 },
  automatic: { color: '#927ab7', pattern: 'hatched', icon: 'rotate-cw', roughness: 0.34, metalness: 0.7 },
  calendar: { color: '#6198bf', pattern: 'crosshatched', icon: 'calendar-days', roughness: 0.36, metalness: 0.58 },
  fasteners: { color: '#acb2b5', pattern: 'dotted', icon: 'bolt', roughness: 0.3, metalness: 0.82 },
}

const PROVENANCE_LANGUAGE: Record<VisualProvenanceClass, {
  outline: VisualMaterialDescriptor['outline']
  icon: string
  label: string
  brightness: number
}> = {
  official: { outline: 'thin', icon: 'file-check-2', label: 'geometría oficial', brightness: 1 },
  measured: { outline: 'double', icon: 'ruler', label: 'geometría medida', brightness: 1.04 },
  reconstructed: { outline: 'thick', icon: 'scan-line', label: 'geometría reconstruida', brightness: 0.96 },
  estimated: { outline: 'dashed', icon: 'triangle-alert', label: 'geometría estimada', brightness: 0.9 },
  conceptual: { outline: 'thick', icon: 'graduation-cap', label: 'representación conceptual', brightness: 1.08 },
  unknown: { outline: 'dashed', icon: 'circle-help', label: 'geometría desconocida', brightness: 0.72 },
}

export function visualMaterialFor(
  subsystem: string | undefined,
  provenance: VisualProvenanceClass,
): VisualMaterialDescriptor {
  const subsystemId = subsystem ?? 'unknown'
  const semantic = SUBSYSTEM_LANGUAGE[subsystemId] ?? {
    color: '#879092',
    pattern: 'dotted' as const,
    icon: 'component',
    roughness: 0.5,
    metalness: 0.45,
  }
  const source = PROVENANCE_LANGUAGE[provenance]
  return {
    subsystem: subsystemId,
    provenance,
    color: semantic.color,
    pattern: semantic.pattern,
    brightness: source.brightness,
    roughness: semantic.roughness,
    metalness: semantic.metalness,
    outline: source.outline,
    icon: `${semantic.icon}+${source.icon}`,
    accessibleLabel: `${subsystemId}; ${source.label}; patrón ${semantic.pattern}; contorno ${source.outline}.`,
  }
}

export function materialDistinguishesWithoutColor(
  left: VisualMaterialDescriptor,
  right: VisualMaterialDescriptor,
): boolean {
  return left.pattern !== right.pattern
    || left.outline !== right.outline
    || left.icon !== right.icon
    || left.roughness !== right.roughness
    || left.metalness !== right.metalness
}
