export type EngineeringDimension =
  | 'length'
  | 'angle'
  | 'time'
  | 'frequency'
  | 'rotational-speed'
  | 'force'
  | 'torque'
  | 'pressure'
  | 'mass'
  | 'density'
  | 'inertia'
  | 'second-area-moment'
  | 'energy'
  | 'power'
  | 'temperature'
  | 'probability'
  | 'rate'
  | 'dimensionless'
  | 'count'

export type EngineeringUnit =
  | 'm'
  | 'mm'
  | 'um'
  | 'rad'
  | 'deg'
  | 's'
  | 'min'
  | 'h'
  | 'Hz'
  | 'vph'
  | 'rpm'
  | 'rph'
  | 'N'
  | 'mN'
  | 'N*m'
  | 'N*mm'
  | 'Pa'
  | 'MPa'
  | 'N/mm2'
  | 'kg'
  | 'g'
  | 'mg'
  | 'kg/m3'
  | 'g/mm3'
  | 'kg*m2'
  | 'mg*cm2'
  | 'm4'
  | 'mm4'
  | 'J'
  | 'uJ'
  | 'W'
  | 'uW'
  | 'K'
  | 'degC'
  | 'percent'
  | 'ratio'
  | '1/s'
  | '1/h'
  | 'count'

export type QuantityProvenance =
  | 'official'
  | 'measured'
  | 'designed'
  | 'derived'
  | 'estimated'
  | 'educational'
  | 'unknown'

export interface EngineeringQuantity {
  value: number
  unit: EngineeringUnit
  dimension: EngineeringDimension
  provenance?: QuantityProvenance
  sourceId?: string
}

interface UnitDefinition {
  dimension: EngineeringDimension
  symbol: string
  toCanonical: (value: number) => number
  fromCanonical: (value: number) => number
}

function scaled(
  dimension: EngineeringDimension,
  symbol: string,
  scale: number,
): UnitDefinition {
  return {
    dimension,
    symbol,
    toCanonical: (value) => value * scale,
    fromCanonical: (value) => value / scale,
  }
}

export const ENGINEERING_UNITS: Record<EngineeringUnit, UnitDefinition> = {
  m: scaled('length', 'm', 1),
  mm: scaled('length', 'mm', 1e-3),
  um: scaled('length', 'µm', 1e-6),
  rad: scaled('angle', 'rad', 1),
  deg: scaled('angle', '°', Math.PI / 180),
  s: scaled('time', 's', 1),
  min: scaled('time', 'min', 60),
  h: scaled('time', 'h', 3600),
  Hz: scaled('frequency', 'Hz', 1),
  vph: scaled('frequency', 'A/h', 1 / 7200),
  rpm: scaled('rotational-speed', 'rpm', 1 / 60),
  rph: scaled('rotational-speed', 'r/h', 1 / 3600),
  N: scaled('force', 'N', 1),
  mN: scaled('force', 'mN', 1e-3),
  'N*m': scaled('torque', 'N·m', 1),
  'N*mm': scaled('torque', 'N·mm', 1e-3),
  Pa: scaled('pressure', 'Pa', 1),
  MPa: scaled('pressure', 'MPa', 1e6),
  'N/mm2': scaled('pressure', 'N/mm²', 1e6),
  kg: scaled('mass', 'kg', 1),
  g: scaled('mass', 'g', 1e-3),
  mg: scaled('mass', 'mg', 1e-6),
  'kg/m3': scaled('density', 'kg/m³', 1),
  'g/mm3': scaled('density', 'g/mm³', 1e6),
  'kg*m2': scaled('inertia', 'kg·m²', 1),
  'mg*cm2': scaled('inertia', 'mg·cm²', 1e-10),
  m4: scaled('second-area-moment', 'm⁴', 1),
  mm4: scaled('second-area-moment', 'mm⁴', 1e-12),
  J: scaled('energy', 'J', 1),
  uJ: scaled('energy', 'µJ', 1e-6),
  W: scaled('power', 'W', 1),
  uW: scaled('power', 'µW', 1e-6),
  K: scaled('temperature', 'K', 1),
  degC: {
    dimension: 'temperature',
    symbol: '°C',
    toCanonical: (value) => value + 273.15,
    fromCanonical: (value) => value - 273.15,
  },
  percent: scaled('probability', '%', 0.01),
  ratio: scaled('dimensionless', '', 1),
  '1/s': scaled('rate', 's⁻¹', 1),
  '1/h': scaled('rate', 'h⁻¹', 1 / 3600),
  count: scaled('count', '', 1),
}

export function quantity(
  value: number,
  unit: EngineeringUnit,
  provenance?: QuantityProvenance,
  sourceId?: string,
): EngineeringQuantity {
  if (!Number.isFinite(value)) throw new Error(`La cantidad ${value} ${unit} no es finita.`)
  return {
    value,
    unit,
    dimension: ENGINEERING_UNITS[unit].dimension,
    ...(provenance ? { provenance } : {}),
    ...(sourceId ? { sourceId } : {}),
  }
}

export function canonicalValue(input: EngineeringQuantity): number {
  const definition = ENGINEERING_UNITS[input.unit]
  if (definition.dimension !== input.dimension) {
    throw new Error(`La unidad ${input.unit} no pertenece a la magnitud ${input.dimension}.`)
  }
  return definition.toCanonical(input.value)
}

export function convertQuantity(
  input: EngineeringQuantity,
  targetUnit: EngineeringUnit,
): EngineeringQuantity {
  const source = ENGINEERING_UNITS[input.unit]
  const target = ENGINEERING_UNITS[targetUnit]
  if (source.dimension !== target.dimension || input.dimension !== target.dimension) {
    throw new Error(`No se puede convertir ${input.unit} a ${targetUnit}: las magnitudes no coinciden.`)
  }
  return {
    ...input,
    value: target.fromCanonical(source.toCanonical(input.value)),
    unit: targetUnit,
    dimension: target.dimension,
  }
}

export function unitSymbol(unit: EngineeringUnit): string {
  return ENGINEERING_UNITS[unit].symbol
}
