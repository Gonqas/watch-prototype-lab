import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from 'lucide-react'
import { DATA_QUALITY_LABELS, type DataQuality, type FindingSeverity, type Reliability } from '../types'

interface NumberControlProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

interface SelectControlProps<T extends string> {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

interface ToggleControlProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

interface TextControlProps {
  label: string
  value: string
  multiline?: boolean
  onChange: (value: string) => void
}

export function NumberControl({ label, value, min = 0, max = 50, step = 0.01, unit = 'mm', onChange }: NumberControlProps) {
  return (
    <label className="control">
      <span>{label}</span>
      <div className="control-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          className="number-input"
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <em>{unit}</em>
      </div>
    </label>
  )
}

export function SelectControl<T extends string>({ label, value, options, onChange }: SelectControlProps<T>) {
  return (
    <label className="control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  return (
    <label className="toggle-control">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function TextControl({ label, value, multiline = false, onChange }: TextControlProps) {
  return (
    <label className="control">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}

export function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="color-control">
      <span>{label}</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export function QualityPill({ quality }: { quality: DataQuality }) {
  return <span className={`quality-pill quality-${quality}`}>{DATA_QUALITY_LABELS[quality]}</span>
}

export function ReliabilityPill({ reliability }: { reliability: Reliability }) {
  return <span className="reliability-pill">{reliability}</span>
}

export function SeverityIcon({ severity }: { severity: FindingSeverity }) {
  if (severity === 'bad') return <XCircle size={16} />
  if (severity === 'experimental') return <AlertTriangle size={16} />
  if (severity === 'warning') return <CircleDashed size={16} />
  return <CheckCircle2 size={16} />
}

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {detail ? <p>{detail}</p> : null}
    </div>
  )
}
