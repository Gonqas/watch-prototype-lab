import type { EditorTool, SelectablePart, ValidationResult, WatchDesign } from '../types'

export interface EditorToolDefinition {
  id: EditorTool
  label: string
  detail: string
  color: string
}

export interface LiveLimitReadout {
  label: string
  value: string
  detail: string
  tone: 'ok' | 'warn' | 'bad' | 'opportunity'
}

export const editorToolDefinitions: Record<EditorTool, EditorToolDefinition> = {
  move: { id: 'move', label: 'Mover', detail: 'XY', color: '#f97316' },
  size: { id: 'size', label: 'Tamaño', detail: 'radio/largo', color: '#22c55e' },
  height: { id: 'height', label: 'Altura', detail: 'Z', color: '#38bdf8' },
  depth: { id: 'depth', label: 'Profundidad', detail: 'hundimiento', color: '#38bdf8' },
  radius: { id: 'radius', label: 'Radio', detail: 'zona', color: '#22c55e' },
  curve: { id: 'curve', label: 'Curva', detail: 'punta/puente', color: '#a78bfa' },
}

export const getToolsForPart = (part: SelectablePart): EditorTool[] => {
  if (part === 'dial') return ['depth', 'radius', 'height']
  if (part.startsWith('relief:')) return ['move', 'height', 'size']
  if (part === 'hourHand' || part === 'minuteHand' || part === 'secondHand') return ['size', 'height', 'curve']
  if (part === 'case') return ['size', 'height']
  if (part === 'crystal') return ['height', 'size']
  if (part === 'stem' || part === 'crown') return ['size']
  return []
}

export const normalizeToolForPart = (part: SelectablePart, tool: EditorTool): EditorTool => {
  const tools = getToolsForPart(part)
  return tools.includes(tool) ? tool : (tools[0] ?? 'move')
}

export const snapValue = (value: number, enabled: boolean, step: number) => {
  if (!enabled || step <= 0) return value
  return Math.round(value / step) * step
}

export const roundLiveMm = (value: number, enabled: boolean, step: number, digits = 2) =>
  Number(snapValue(value, enabled, step).toFixed(digits))

export const selectedPartLimitTone = (
  design: WatchDesign,
  part: SelectablePart,
  result: ValidationResult,
): 'ok' | 'warn' | 'bad' | 'opportunity' => {
  const hasHardConflict = result.findings.some((finding) => finding.severity === 'bad' && finding.pieceIds.includes(part))
  if (hasHardConflict) return 'bad'

  if (part.startsWith('relief:')) {
    const relief = design.dial.reliefs.find((item) => `relief:${item.id}` === part)
    if (!relief) return 'warn'
    if (relief.height > 0.55) return 'warn'
    return 'ok'
  }

  if (part === 'dial' && design.dial.sunkenCenter && design.dial.sunkenDepth > 0.65) return 'opportunity'
  if (part === 'crystal' && result.metrics.crystalClearance < 0.7) return 'warn'
  if ((part === 'hourHand' || part === 'minuteHand' || part === 'secondHand') && result.metrics.crystalClearance < 0.7) return 'warn'

  return 'ok'
}

export const toneColor = (tone: 'ok' | 'warn' | 'bad' | 'opportunity') => {
  if (tone === 'bad') return '#ef4444'
  if (tone === 'warn') return '#f4d35e'
  if (tone === 'opportunity') return '#8b5cf6'
  return '#22c55e'
}

const formatSignedMm = (value: number) => {
  const rounded = Number(value.toFixed(2)).toLocaleString('es-ES')
  return `${value > 0 ? '+' : ''}${rounded} mm`
}

const toneFromMargin = (margin: number): LiveLimitReadout['tone'] => {
  if (margin < 0) return 'bad'
  if (margin < 0.3) return 'warn'
  if (margin > 0.7) return 'opportunity'
  return 'ok'
}

export const getLiveLimitReadout = (
  design: WatchDesign,
  part: SelectablePart,
  result: ValidationResult,
): LiveLimitReadout => {
  const hardFinding = result.findings.find((finding) => finding.severity === 'bad' && finding.pieceIds.includes(part))
  if (hardFinding) {
    return {
      label: 'Límite activo',
      value: 'Colisión',
      detail: hardFinding.title,
      tone: 'bad',
    }
  }

  if (part === 'case' || part === 'movement') {
    const margin = result.metrics.movementCaseClearance
    return {
      label: 'Movimiento/caja',
      value: formatSignedMm(margin),
      detail: margin < 0.3 ? 'zona muy justa' : 'margen viable',
      tone: toneFromMargin(margin),
    }
  }

  if (part === 'dial') {
    const margin = result.metrics.minimumClearance
    return {
      label: design.dial.sunkenCenter ? 'Centro hundido' : 'Dial base',
      value: formatSignedMm(margin),
      detail: design.dial.sunkenCenter ? 'profundidad contra stack de agujas' : 'dial normal editable',
      tone: toneFromMargin(margin),
    }
  }

  if (part === 'crystal' || part === 'hourHand' || part === 'minuteHand' || part === 'secondHand') {
    const margin = result.metrics.crystalClearance
    return {
      label: 'Margen al cristal',
      value: formatSignedMm(margin),
      detail: margin < 0.7 ? 'vigila altura de agujas/cristal' : 'espacio creativo disponible',
      tone: toneFromMargin(margin),
    }
  }

  if (part.startsWith('relief:')) {
    const relief = design.dial.reliefs.find((item) => `relief:${item.id}` === part)
    const margin = result.metrics.minimumClearance
    return {
      label: relief?.label ?? 'Relieve',
      value: formatSignedMm(margin),
      detail: margin < 0.3 ? 'cerca del barrido de agujas' : 'relieve con margen',
      tone: toneFromMargin(margin),
    }
  }

  return {
    label: 'Margen activo',
    value: formatSignedMm(result.metrics.minimumClearance),
    detail: 'validación del conjunto',
    tone: toneFromMargin(result.metrics.minimumClearance),
  }
}
