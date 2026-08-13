import {
  canonicalValue,
  convertQuantity,
  quantity,
  type EngineeringQuantity,
  type EngineeringUnit,
} from '../horology-engineering'
import type { VersionedMetrologyEntity } from './identity'

export type MeasurementMethod = 'direct' | 'comparative' | 'optical-2d' | 'calculated' | 'manual-count' | 'other'
export type MeasurementFeature = 'length' | 'diameter' | 'radius' | 'thickness' | 'height' | 'angle' | 'runout' | 'mass' | 'count' | 'other'

export interface MeasurementTarget {
  specimenId: string
  componentId?: string
  fixtureEntityId?: string
  feature: MeasurementFeature
  featureDescription: string
  datumIds: string[]
  referenceFrame: string
  orientation: string
  scope: 'single-point' | 'two-point' | 'local-region' | 'full-feature' | 'derived-2d'
}

export interface MeasurementDefinition extends VersionedMetrologyEntity {
  profileId: string
  displayName: string
  target: MeasurementTarget
  method: MeasurementMethod
  preferredUnit: EngineeringUnit
  instrumentType?: string
  procedure: string[]
  acceptanceTolerance?: { lower?: EngineeringQuantity; upper?: EngineeringQuantity; sourceId: string }
  requiredReadingCount: number
  environmentalRequirements: string[]
  assumptions: string[]
  limitations: string[]
}

export interface MeasurementReading extends VersionedMetrologyEntity {
  profileId: string
  specimenId: string
  seriesId: string
  sequence: number
  value: EngineeringQuantity
  capturedAt: string
  operator: string
  orientation: string
  conditions: Record<string, string>
  note?: string
  discarded: boolean
  discardReason?: string
}

export interface MeasurementStatistics {
  count: number
  adoptedCount: number
  minimum?: EngineeringQuantity
  maximum?: EngineeringQuantity
  mean?: EngineeringQuantity
  range?: EngineeringQuantity
  sampleStandardDeviation?: EngineeringQuantity
}

export interface UncertaintyComponent {
  id: string
  label: string
  source: 'resolution' | 'repeatability' | 'calibration' | 'declared-other'
  standardUncertainty: EngineeringQuantity
  distribution: 'rectangular' | 'normal' | 'declared'
  divisor: number
  evidenceReference?: string
}

export interface UncertaintyDeclaration {
  schemaVersion: 1
  method: 'declared-rss'
  unit: EngineeringUnit
  components: UncertaintyComponent[]
  combinedStandardUncertainty: EngineeringQuantity
  coverageFactor: number
  expandedUncertainty: EngineeringQuantity
  coverageStatement: string
  rounding: string
  assumptions: string[]
  limitations: string[]
  gumCompliant: false
}

export interface MeasurementResult {
  adoptedValue: EngineeringQuantity
  adoptionMethod: 'mean' | 'median' | 'single-reading' | 'manual-decision'
  adoptionReason: string
  statistics: MeasurementStatistics
  uncertainty?: UncertaintyDeclaration
}

export interface MeasurementSeries extends VersionedMetrologyEntity {
  profileId: string
  definitionId: string
  specimenId: string
  componentId?: string
  instrumentId: string
  instrumentVerificationId?: string
  operator: string
  startedAt: string
  completedAt?: string
  orientation: string
  conditions: Record<string, string>
  readingIds: string[]
  result?: MeasurementResult
  status: 'draft' | 'complete' | 'invalidated'
  invalidationReason?: string
}

function assertComparableQuantities(values: readonly EngineeringQuantity[]): EngineeringUnit {
  const first = values[0]
  if (!first) throw new Error('La serie no contiene lecturas.')
  for (const value of values) {
    if (value.dimension !== first.dimension) throw new Error('La serie mezcla magnitudes incompatibles.')
  }
  return first.unit
}

export function calculateMeasurementStatistics(readings: readonly MeasurementReading[]): MeasurementStatistics {
  const ordered = readings.toSorted((left, right) => left.sequence - right.sequence)
  if (ordered.some((reading, index) => reading.sequence !== index + 1)) {
    throw new Error('Las lecturas deben conservar un orden continuo comenzando en 1.')
  }
  for (const reading of ordered) {
    if (reading.discarded && !reading.discardReason?.trim()) {
      throw new Error(`La lectura ${reading.id} fue descartada sin motivo.`)
    }
  }
  const adopted = ordered.filter(({ discarded }) => !discarded)
  if (adopted.length === 0) return { count: readings.length, adoptedCount: 0 }
  const unit = assertComparableQuantities(adopted.map(({ value }) => value))
  const normalized = adopted.map(({ value }) => convertQuantity(value, unit).value)
  const mean = normalized.reduce((sum, value) => sum + value, 0) / normalized.length
  const minimum = Math.min(...normalized)
  const maximum = Math.max(...normalized)
  const variance = normalized.length > 1
    ? normalized.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (normalized.length - 1)
    : 0
  return {
    count: readings.length,
    adoptedCount: adopted.length,
    minimum: quantity(minimum, unit, 'measured'),
    maximum: quantity(maximum, unit, 'measured'),
    mean: quantity(mean, unit, 'derived'),
    range: quantity(maximum - minimum, unit, 'derived'),
    sampleStandardDeviation: quantity(Math.sqrt(variance), unit, 'derived'),
  }
}

export function declareMeasurementUncertainty({
  unit,
  resolution,
  repeatability,
  calibration,
  other = [],
  coverageFactor = 2,
  assumptions = [],
  limitations = [],
}: {
  unit: EngineeringUnit
  resolution: EngineeringQuantity
  repeatability?: EngineeringQuantity
  calibration?: EngineeringQuantity
  other?: UncertaintyComponent[]
  coverageFactor?: number
  assumptions?: string[]
  limitations?: string[]
}): UncertaintyDeclaration {
  if (coverageFactor <= 0) throw new Error('El factor de cobertura debe ser positivo.')
  const resolutionValue = Math.abs(convertQuantity(resolution, unit).value)
  const components: UncertaintyComponent[] = [{
    id: 'resolution',
    label: 'Resolución del instrumento',
    source: 'resolution',
    standardUncertainty: quantity(resolutionValue / Math.sqrt(12), unit, 'derived'),
    distribution: 'rectangular',
    divisor: Math.sqrt(12),
  }]
  if (repeatability) components.push({
    id: 'repeatability',
    label: 'Repetibilidad observada',
    source: 'repeatability',
    standardUncertainty: quantity(Math.abs(convertQuantity(repeatability, unit).value), unit, 'measured'),
    distribution: 'normal',
    divisor: 1,
  })
  if (calibration) components.push({
    id: 'calibration',
    label: 'Declaración de calibración o comparación',
    source: 'calibration',
    standardUncertainty: quantity(Math.abs(convertQuantity(calibration, unit).value), unit, 'official'),
    distribution: 'declared',
    divisor: 1,
  })
  for (const component of other) {
    convertQuantity(component.standardUncertainty, unit)
    components.push(structuredClone(component))
  }
  const combined = Math.sqrt(components.reduce((sum, component) => {
    const value = convertQuantity(component.standardUncertainty, unit).value
    return sum + value ** 2
  }, 0))
  return {
    schemaVersion: 1,
    method: 'declared-rss',
    unit,
    components,
    combinedStandardUncertainty: quantity(combined, unit, 'derived'),
    coverageFactor,
    expandedUncertainty: quantity(combined * coverageFactor, unit, 'derived'),
    coverageStatement: `Incertidumbre expandida declarada con k=${coverageFactor}; la cobertura probabilística no se presume.`,
    rounding: 'El valor y la incertidumbre deben presentarse con resolución coherente.',
    assumptions,
    limitations: ['No constituye por sí sola una evaluación GUM/ISO acreditada.', ...limitations],
    gumCompliant: false,
  }
}

export function resolveSeriesResult(
  readings: readonly MeasurementReading[],
  uncertainty: UncertaintyDeclaration | undefined,
  adoptionReason: string,
): MeasurementResult {
  const statistics = calculateMeasurementStatistics(readings)
  if (!statistics.mean) throw new Error('No hay lecturas adoptables para resolver la serie.')
  return {
    adoptedValue: statistics.mean,
    adoptionMethod: statistics.adoptedCount === 1 ? 'single-reading' : 'mean',
    adoptionReason,
    statistics,
    ...(uncertainty ? { uncertainty: structuredClone(uncertainty) } : {}),
  }
}

export function quantitiesHaveSameReferenceMagnitude(left: EngineeringQuantity, right: EngineeringQuantity): boolean {
  return left.dimension === right.dimension && Number.isFinite(canonicalValue(left)) && Number.isFinite(canonicalValue(right))
}
