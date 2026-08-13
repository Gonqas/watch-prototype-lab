import { convertQuantity, quantity, type EngineeringQuantity, type EngineeringUnit } from '../horology-engineering'
import type { VersionedMetrologyEntity } from './identity'
import type { MeasurementSeries } from './measurements'

export type ComparisonInterpretation =
  | 'compatible-with-nominal'
  | 'within-declared-uncertainty'
  | 'apparent-discrepancy'
  | 'comparison-invalid'
  | 'tolerance-unknown'
  | 'nominal-missing'
  | 'measurement-insufficient'
  | 'different-reference-frame'

export interface NominalValue {
  value: EngineeringQuantity
  sourceId: string
  sourceRevision?: string
  sourceKind: 'official' | 'design' | 'fixture' | 'estimated'
  tolerance?: { lower?: EngineeringQuantity; upper?: EngineeringQuantity }
  referenceFrame: string
  scope: string
}

export interface NominalMeasuredComparison extends VersionedMetrologyEntity {
  profileId: string
  specimenId: string
  componentId?: string
  fixtureEntityId?: string
  fixtureRevision?: string
  reconstructionLevel?: 'R0' | 'R1' | 'R2' | 'R3' | 'R4'
  fidelity?: { geometry: string; kinematics: string; physics: string }
  measurementSeriesId?: string
  nominal?: NominalValue
  measured?: EngineeringQuantity
  measuredUncertainty?: EngineeringQuantity
  delta?: EngineeringQuantity
  percentageDelta?: number
  interpretation: ComparisonInterpretation
  reasons: string[]
  limitations: string[]
}

export function compareNominalAndMeasured({
  base,
  series,
  nominal,
}: {
  base: Omit<NominalMeasuredComparison, 'nominal' | 'measured' | 'measuredUncertainty' | 'delta' | 'interpretation' | 'reasons'>
  series?: MeasurementSeries
  nominal?: NominalValue
}): NominalMeasuredComparison {
  if (!nominal) return { ...base, nominal: undefined, interpretation: 'nominal-missing', reasons: ['No existe un valor nominal declarado.'] }
  if (!series?.result) return { ...base, nominal, interpretation: 'measurement-insufficient', reasons: ['La serie no tiene un resultado adoptado.'] }
  if (series.status !== 'complete') return { ...base, nominal, interpretation: 'measurement-insufficient', reasons: ['La serie no está completa.'] }
  if (nominal.referenceFrame !== series.orientation && !series.orientation.includes(nominal.referenceFrame)) {
    return { ...base, nominal, measured: series.result.adoptedValue, interpretation: 'different-reference-frame', reasons: ['Los marcos de referencia u orientaciones no coinciden.'] }
  }
  if (nominal.value.dimension !== series.result.adoptedValue.dimension) {
    return { ...base, nominal, measured: series.result.adoptedValue, interpretation: 'comparison-invalid', reasons: ['Las magnitudes no son compatibles.'] }
  }
  const unit = nominal.value.unit
  const measured = convertQuantity(series.result.adoptedValue, unit)
  const delta = quantity(measured.value - nominal.value.value, unit, 'derived')
  const percentageDelta = nominal.value.value === 0 ? undefined : delta.value / Math.abs(nominal.value.value) * 100
  const measuredUncertainty = series.result.uncertainty
    ? convertQuantity(series.result.uncertainty.expandedUncertainty, unit)
    : undefined
  const tolerance = nominal.tolerance
  if (!tolerance?.lower && !tolerance?.upper) {
    const withinUncertainty = measuredUncertainty && Math.abs(delta.value) <= measuredUncertainty.value
    return {
      ...base,
      nominal,
      measured,
      ...(measuredUncertainty ? { measuredUncertainty } : {}),
      delta,
      ...(percentageDelta === undefined ? {} : { percentageDelta }),
      interpretation: withinUncertainty ? 'within-declared-uncertainty' : 'tolerance-unknown',
      reasons: [withinUncertainty ? 'La diferencia no supera la incertidumbre expandida declarada.' : 'No hay tolerancia declarada para decidir compatibilidad.'],
    }
  }
  const lower = tolerance.lower ? convertQuantity(tolerance.lower, unit).value : Number.NEGATIVE_INFINITY
  const upper = tolerance.upper ? convertQuantity(tolerance.upper, unit).value : Number.POSITIVE_INFINITY
  const compatible = measured.value >= lower && measured.value <= upper
  const intervalOverlaps = measuredUncertainty
    ? measured.value + measuredUncertainty.value >= lower && measured.value - measuredUncertainty.value <= upper
    : false
  return {
    ...base,
    nominal,
    measured,
    ...(measuredUncertainty ? { measuredUncertainty } : {}),
    delta,
    ...(percentageDelta === undefined ? {} : { percentageDelta }),
    interpretation: compatible
      ? 'compatible-with-nominal'
      : intervalOverlaps
        ? 'within-declared-uncertainty'
        : 'apparent-discrepancy',
    reasons: [compatible
      ? 'El valor adoptado está dentro de la tolerancia declarada.'
      : intervalOverlaps
        ? 'El intervalo de incertidumbre declarado solapa la tolerancia.'
        : 'Existe una discrepancia aparente; no demuestra por sí sola un defecto.'],
  }
}

export function comparisonDeltaUnit(comparison: NominalMeasuredComparison): EngineeringUnit | undefined {
  return comparison.delta?.unit
}
