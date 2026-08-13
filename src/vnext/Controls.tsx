import type { ReactNode } from 'react'
import type { DataQuality, Dimension } from './model'

export function NumberField({
  label,
  dimension,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string
  dimension: Dimension
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  const value = dimension.value ?? min
  const tolerance = Math.max(dimension.minus, dimension.plus)
  const precision = step >= 1 ? 0 : Math.min(12, Math.max(2, Math.ceil(-Math.log10(step))))
  return (
    <div className="number-field">
      <div className="number-field__label">
        <label htmlFor={`number-${label.replaceAll(' ', '-').toLowerCase()}`}>{label}</label>
        {tolerance > 0 && <span>±{tolerance.toFixed(Math.min(precision, 6))}</span>}
      </div>
      <div className="number-field__controls">
        <input
          type="range"
          aria-label={`${label}, deslizador`}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="number-field__input">
          <input
            id={`number-${label.replaceAll(' ', '-').toLowerCase()}`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(precision))}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span>{dimension.unit === 'count' ? '' : dimension.unit}</span>
        </div>
      </div>
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string; icon?: ReactNode }>
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented-field">
      <span className="segmented-field__label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={option.value === value ? 'is-active' : undefined}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}

export function InspectorSection({
  title,
  children,
  defaultOpen = true,
  action,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  action?: ReactNode
}) {
  return (
    <details className="inspector-section" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {action}
      </summary>
      <div className="inspector-section__body">{children}</div>
    </details>
  )
}

const qualityLabels: Record<DataQuality, string> = {
  official_complete: 'Oficial',
  official_partial: 'Oficial parcial',
  supplier_partial: 'Proveedor',
  designed: 'Disenado',
  measured_by_user: 'Medido',
  estimated: 'Estimado',
  unknown: 'Pendiente',
  visual_only: 'Solo visual',
}

export function SourceBadge({ dimension }: { dimension: Dimension }) {
  return (
    <div className={`source-badge source-badge--${dimension.quality}`} title={dimension.source}>
      <span>{qualityLabels[dimension.quality]}</span>
      <small>{dimension.source}</small>
    </div>
  )
}

export function ColorSwatches({
  value,
  onChange,
  colors,
  label,
}: {
  value: string
  onChange: (color: string) => void
  colors: string[]
  label: string
}) {
  return (
    <div className="swatch-field">
      <span>{label}</span>
      <div className="swatches" role="group" aria-label={label}>
        {colors.map((color) => (
          <button
            type="button"
            key={color}
            aria-label={`${label} ${color}`}
            aria-pressed={value.toLowerCase() === color.toLowerCase()}
            className={value.toLowerCase() === color.toLowerCase() ? 'is-active' : undefined}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
        <label className="swatches__custom" title="Color personalizado">
          <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        </label>
      </div>
    </div>
  )
}

export function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'warning' | 'bad' | 'opportunity'
}) {
  return (
    <div className={`metric metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
