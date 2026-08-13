import { z } from 'zod'
import {
  AssemblyDependencyIdSchema,
  AssemblyInterfaceIdSchema,
  CanonicalAssemblySchema,
  PartDefinitionIdSchema,
  PartInstanceIdSchema,
  validateCanonicalAssembly,
} from '../canonical'
import { FidelityProfileSchema } from '../fidelity'
import { SelectorCardinalitySchema, SemanticSelectorSchema } from '../runtime/selectors'

export const reconstructionLevelValues = ['R0', 'R1', 'R2', 'R3', 'R4'] as const
export const reconstructionStateValues = [
  'documented',
  'envelope-only',
  'structurally-modelled',
  'visually-reconstructed',
  'physically-measured',
  'validated',
  'blocked',
  'unknown',
] as const
export const technicalDataLayerValues = [
  'official-nominal',
  'official-part-identity',
  'document-inferred-relation',
  'visual-reconstruction-estimate',
  'physical-unit-observation',
  'physical-unit-measurement',
  'educational-simulation',
  'unknown',
] as const
export const functionalRelationshipValues = [
  'part-of',
  'supports',
  'pivots-in',
  'meshes-with',
  'drives',
  'locks',
  'releases',
  'impulses',
  'winds',
  'sets',
  'retains',
  'covers',
  'fastened-by',
  'remove-before',
  'inspect-before',
] as const

export const ReconstructionLevelSchema = z.enum(reconstructionLevelValues)
export const ReconstructionStateSchema = z.enum(reconstructionStateValues)
export const TechnicalDataLayerSchema = z.enum(technicalDataLayerValues)
export const FunctionalRelationshipSchema = z.enum(functionalRelationshipValues)

export type ReconstructionLevel = z.infer<typeof ReconstructionLevelSchema>
export type ReconstructionState = z.infer<typeof ReconstructionStateSchema>
export type TechnicalDataLayer = z.infer<typeof TechnicalDataLayerSchema>
export type FunctionalRelationship = z.infer<typeof FunctionalRelationshipSchema>

const technicalId = z.string().regex(/^[a-z0-9][a-z0-9._:-]{2,199}$/)
const finiteNumber = z.number().finite()
const vector3 = z.tuple([finiteNumber, finiteNumber, finiteNumber])

export const TechnicalDatumSchema = z.object({
  id: technicalId,
  label: z.string().min(1).max(240),
  kind: z.enum(['dimension', 'position', 'count', 'identity', 'relationship', 'simulation-state']),
  value: z.union([finiteNumber, z.string().min(1).max(500), vector3]).nullable(),
  unit: z.enum(['mm', 'deg', 'count', 'hours', 'vph', 'normalized', 'text', 'none']),
  layer: TechnicalDataLayerSchema,
  sourceIds: z.array(technicalId).default([]),
  method: z.string().min(1).max(1000),
  physicalUnitId: z.string().min(1).max(160).optional(),
  uncertainty: z.object({
    plusMinus: finiteNumber.nonnegative(),
    unit: z.string().min(1).max(32),
    confidence: finiteNumber.min(0).max(1).optional(),
  }).strict().optional(),
  limitations: z.array(z.string().min(1).max(1000)).default([]),
}).strict().superRefine((datum, context) => {
  if ((datum.layer === 'official-nominal' || datum.layer === 'official-part-identity') && datum.sourceIds.length === 0) {
    context.addIssue({ code: 'custom', path: ['sourceIds'], message: 'Un dato oficial necesita una fuente oficial.' })
  }
  if (datum.layer === 'unknown' && datum.value !== null) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Un dato desconocido no puede contener un valor.' })
  }
  if (datum.layer !== 'unknown' && datum.value === null) {
    context.addIssue({ code: 'custom', path: ['value'], message: 'Un dato con valor ausente debe clasificarse como unknown.' })
  }
  if (datum.layer === 'official-nominal' && datum.unit === 'normalized') {
    context.addIssue({ code: 'custom', path: ['unit'], message: 'Una coordenada normalizada no puede presentarse como dato nominal oficial.' })
  }
  if (datum.layer === 'physical-unit-measurement' && !datum.physicalUnitId) {
    context.addIssue({ code: 'custom', path: ['physicalUnitId'], message: 'Una medición necesita identificar la unidad física.' })
  }
})
export type TechnicalDatum = z.infer<typeof TechnicalDatumSchema>

const officialDimensionSchema = TechnicalDatumSchema.refine(
  ({ kind, layer }) => kind === 'dimension' && layer === 'official-nominal',
  'Las dimensiones oficiales deben usar kind=dimension y layer=official-nominal.',
)
const measuredDimensionSchema = TechnicalDatumSchema.refine(
  ({ kind, layer }) => kind === 'dimension' && layer === 'physical-unit-measurement',
  'Las dimensiones medidas deben usar kind=dimension y layer=physical-unit-measurement.',
)
const estimatedDimensionSchema = TechnicalDatumSchema.refine(
  ({ kind, layer }) => kind === 'dimension' && layer === 'visual-reconstruction-estimate',
  'Las dimensiones estimadas deben usar kind=dimension y layer=visual-reconstruction-estimate.',
)

export const ReconstructionPartRecordSchema = z.object({
  canonicalId: PartDefinitionIdSchema,
  instanceIds: z.array(PartInstanceIdSchema).min(1),
  entityKind: z.enum(['official-part', 'official-assembly', 'interface-placeholder', 'conceptual-component']),
  manufacturer: z.string().min(1).max(160).optional(),
  calibre: z.string().min(1).max(80).optional(),
  family: z.string().min(1).max(120).optional(),
  variant: z.string().min(1).max(120).optional(),
  officialReference: z.string().min(1).max(160).optional(),
  nameEs: z.string().min(1).max(240),
  nameEn: z.string().min(1).max(240),
  nameEsClassification: z.literal('editorial-translation'),
  subsystem: z.string().min(1).max(120),
  sourceIds: z.array(technicalId).min(1),
  officialGeometryAvailable: z.boolean(),
  officialDimensions: z.array(officialDimensionSchema).default([]),
  measuredDimensions: z.array(measuredDimensionSchema).default([]),
  estimatedDimensions: z.array(estimatedDimensionSchema).default([]),
  toothCount: TechnicalDatumSchema.optional(),
  interfaceIds: z.array(AssemblyInterfaceIdSchema).default([]),
  functionalRelationshipIds: z.array(technicalId).default([]),
  geometryPrimitiveIds: z.array(technicalId).default([]),
  modelState: ReconstructionStateSchema,
  reconstructionLevel: ReconstructionLevelSchema,
  fidelity: FidelityProfileSchema,
  limitations: z.array(z.string().min(1).max(1000)).default([]),
  physicalUnitId: z.string().min(1).max(160).optional(),
  revision: z.string().min(1).max(80),
  reviewedAt: z.string().min(10),
}).strict().superRefine((record, context) => {
  if (record.entityKind === 'official-part' && !record.officialReference) {
    context.addIssue({ code: 'custom', path: ['officialReference'], message: 'Una pieza oficial necesita referencia oficial.' })
  }
  if (record.reconstructionLevel === 'R4' && !record.physicalUnitId) {
    context.addIssue({ code: 'custom', path: ['physicalUnitId'], message: 'R4 necesita una unidad física identificada.' })
  }
  if (record.modelState === 'physically-measured' && record.measuredDimensions.length === 0) {
    context.addIssue({ code: 'custom', path: ['measuredDimensions'], message: 'El estado physically-measured necesita mediciones.' })
  }
})
export type ReconstructionPartRecord = z.infer<typeof ReconstructionPartRecordSchema>

export const TechnicalGeometryPrimitiveSchema = z.object({
  id: technicalId,
  entityId: PartInstanceIdSchema,
  shape: z.enum(['disc', 'ring', 'box', 'rod', 'coil', 'spiral', 'bridge', 'wheel', 'screw', 'symbolic-marker']),
  visualProfile: z.enum([
    'generic',
    'gear',
    'pinion',
    'escape-wheel',
    'barrel-drum',
    'barrel-cover',
    'mainspring',
    'hairspring',
    'balance-wheel',
    'pallet-fork',
    'jewel',
  ]).optional(),
  toothCount: z.number().int().min(6).max(400).optional(),
  boreRatio: finiteNumber.min(0).max(0.85).optional(),
  cutaway: z.boolean().optional(),
  coordinateSpace: z.enum(['normalized-educational', 'millimetres']),
  position: vector3,
  size: vector3,
  layer: TechnicalDataLayerSchema,
  sourceIds: z.array(technicalId).default([]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  opacity: finiteNumber.min(0).max(1).default(1),
  limitations: z.array(z.string().min(1).max(1000)).default([]),
}).strict().superRefine((primitive, context) => {
  if (primitive.coordinateSpace === 'normalized-educational' && primitive.layer === 'official-nominal') {
    context.addIssue({ code: 'custom', path: ['layer'], message: 'Una primitiva normalizada no puede declararse oficial.' })
  }
  if (primitive.layer === 'official-nominal' && primitive.sourceIds.length === 0) {
    context.addIssue({ code: 'custom', path: ['sourceIds'], message: 'La geometría oficial necesita una fuente.' })
  }
})
export type TechnicalGeometryPrimitive = z.infer<typeof TechnicalGeometryPrimitiveSchema>

export const TechnicalFunctionalRelationSchema = z.object({
  id: technicalId,
  type: FunctionalRelationshipSchema,
  fromInstanceId: PartInstanceIdSchema,
  toInstanceId: PartInstanceIdSchema,
  layer: TechnicalDataLayerSchema,
  sourceIds: z.array(technicalId).default([]),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']),
  reversible: z.boolean(),
  limitations: z.array(z.string().min(1).max(1000)).default([]),
}).strict().superRefine((relation, context) => {
  if (
    (relation.layer === 'official-nominal'
      || relation.layer === 'official-part-identity'
      || relation.layer === 'document-inferred-relation')
    && relation.sourceIds.length === 0
  ) {
    context.addIssue({ code: 'custom', path: ['sourceIds'], message: 'Una relación documental necesita una fuente.' })
  }
})
export type TechnicalFunctionalRelation = z.infer<typeof TechnicalFunctionalRelationSchema>

export const TechnicalSelectorContractSchema = z.object({
  id: technicalId,
  selector: SemanticSelectorSchema,
  cardinality: SelectorCardinalitySchema,
  purpose: z.string().min(1).max(500),
}).strict()
export type TechnicalSelectorContract = z.infer<typeof TechnicalSelectorContractSchema>

export const TechnicalFixtureCapabilitySchema = z.object({
  id: technicalId,
  status: z.enum(['available', 'limited', 'unavailable', 'unknown']),
  explanation: z.string().min(1).max(1000),
  limitations: z.array(z.string().min(1).max(1000)).default([]),
}).strict()
export type TechnicalFixtureCapability = z.infer<typeof TechnicalFixtureCapabilitySchema>

export const TechnicalVisualErrorScenarioSchema = z.object({
  id: technicalId,
  label: z.string().min(1).max(240),
  affectedInstanceIds: z.array(PartInstanceIdSchema).min(1),
  effect: z.enum(['hidden', 'blocked-symbolic', 'misaligned-symbolic', 'wrong-order-symbolic']),
  layer: z.literal('educational-simulation'),
  sourceIds: z.array(technicalId).min(1),
  reversible: z.literal(true),
  engineeringValidated: z.literal(false),
  limitations: z.array(z.string().min(1).max(1000)).min(1),
}).strict()
export type TechnicalVisualErrorScenario = z.infer<typeof TechnicalVisualErrorScenarioSchema>

export const TechnicalMovementFixtureSchema = z.object({
  id: technicalId,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  kind: z.enum(['conceptual-quartz', 'official-calibre-quartz', 'conceptual-mechanical', 'official-calibre-mechanical']),
  manufacturer: z.string().min(1).max(160).optional(),
  calibre: z.string().min(1).max(80).optional(),
  family: z.string().min(1).max(120),
  variant: z.string().min(1).max(120),
  reconstructionLevel: ReconstructionLevelSchema,
  assembly: CanonicalAssemblySchema,
  ledger: z.array(ReconstructionPartRecordSchema).min(1),
  geometry: z.array(TechnicalGeometryPrimitiveSchema).min(1),
  relations: z.array(TechnicalFunctionalRelationSchema).min(1),
  selectors: z.array(TechnicalSelectorContractSchema).min(1),
  capabilities: z.array(TechnicalFixtureCapabilitySchema).min(1),
  visualErrorScenarios: z.array(TechnicalVisualErrorScenarioSchema).default([]),
  missingPartRoles: z.array(z.string().min(1).max(160)).default([]),
  sourceIds: z.array(technicalId).min(1),
  fidelity: FidelityProfileSchema,
  limitations: z.array(z.string().min(1).max(1000)).default([]),
}).strict().superRefine((fixture, context) => {
  const validation = validateCanonicalAssembly(fixture.assembly)
  if (!validation.valid) {
    context.addIssue({ code: 'custom', path: ['assembly'], message: validation.issues.map(({ message }) => message).join(' ') })
    return
  }
  const definitionIds = new Set(fixture.assembly.definitions.map(({ id }) => id))
  const instanceIds = new Set(fixture.assembly.instances.map(({ id }) => id))
  const interfaceIds = new Set(fixture.assembly.interfaces.map(({ id }) => id))
  const dependencyIds = new Set(fixture.assembly.dependencies.map(({ id }) => id))
  const relationIds = new Set(fixture.relations.map(({ id }) => id))
  const primitiveIds = new Set(fixture.geometry.map(({ id }) => id))
  for (const [index, record] of fixture.ledger.entries()) {
    if (!definitionIds.has(record.canonicalId)) {
      context.addIssue({ code: 'custom', path: ['ledger', index, 'canonicalId'], message: 'El ledger referencia una definición inexistente.' })
    }
    for (const id of record.instanceIds) {
      if (!instanceIds.has(id)) context.addIssue({ code: 'custom', path: ['ledger', index, 'instanceIds'], message: `Instancia inexistente: ${id}` })
    }
    for (const id of record.interfaceIds) {
      if (!interfaceIds.has(id)) context.addIssue({ code: 'custom', path: ['ledger', index, 'interfaceIds'], message: `Interfaz inexistente: ${id}` })
    }
    for (const id of record.functionalRelationshipIds) {
      if (!relationIds.has(id)) context.addIssue({ code: 'custom', path: ['ledger', index, 'functionalRelationshipIds'], message: `Relación inexistente: ${id}` })
    }
    for (const id of record.geometryPrimitiveIds) {
      if (!primitiveIds.has(id)) context.addIssue({ code: 'custom', path: ['ledger', index, 'geometryPrimitiveIds'], message: `Primitiva inexistente: ${id}` })
    }
  }
  for (const [index, primitive] of fixture.geometry.entries()) {
    if (!instanceIds.has(primitive.entityId)) {
      context.addIssue({ code: 'custom', path: ['geometry', index, 'entityId'], message: 'La primitiva referencia una instancia inexistente.' })
    }
  }
  for (const [index, relation] of fixture.relations.entries()) {
    if (!instanceIds.has(relation.fromInstanceId) || !instanceIds.has(relation.toInstanceId)) {
      context.addIssue({ code: 'custom', path: ['relations', index], message: 'La relación contiene una instancia inexistente.' })
    }
  }
  for (const [index, scenario] of fixture.visualErrorScenarios.entries()) {
    for (const id of scenario.affectedInstanceIds) {
      if (!instanceIds.has(id)) {
        context.addIssue({ code: 'custom', path: ['visualErrorScenarios', index, 'affectedInstanceIds'], message: `Instancia inexistente: ${id}` })
      }
    }
  }
  for (const dependency of fixture.assembly.dependencies) {
    if (!dependencyIds.has(dependency.id)) {
      context.addIssue({ code: 'custom', path: ['assembly', 'dependencies'], message: `Dependencia inexistente: ${dependency.id}` })
    }
  }
})
export type TechnicalMovementFixture = z.infer<typeof TechnicalMovementFixtureSchema>

export function serializeTechnicalFixture(fixture: TechnicalMovementFixture): string {
  return JSON.stringify(TechnicalMovementFixtureSchema.parse(fixture))
}

export function deserializeTechnicalFixture(serialized: string): TechnicalMovementFixture {
  return TechnicalMovementFixtureSchema.parse(JSON.parse(serialized) as unknown)
}

export const TechnicalFixtureReferenceSchema = z.object({
  fixtureId: technicalId,
  fixtureVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  selectorContractIds: z.array(technicalId).min(1),
}).strict()

export const FirstModuleTechnicalFixtureSchema = z.object({
  id: technicalId,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  moduleReference: z.literal('module.horology.functional-map'),
  titleReference: z.literal('Cómo funciona un reloj de principio a fin'),
  fixtures: z.array(TechnicalFixtureReferenceSchema).length(4),
  requiredOperations: z.array(technicalId).min(1),
  reducedMotion: z.object({
    discreteStates: z.boolean(),
    staticNumberedArrows: z.boolean(),
    automaticCameraMotion: z.literal(false),
    stepwiseScrubbing: z.boolean(),
  }).strict(),
  viewportNeeds: z.array(z.object({
    capabilityId: technicalId,
    status: z.enum(['available', 'limited', 'unavailable']),
    blockingForFullVisual: z.boolean(),
    explanation: z.string().min(1).max(1000),
  }).strict()),
  restorationRequired: z.literal(true),
}).strict()
export type FirstModuleTechnicalFixture = z.infer<typeof FirstModuleTechnicalFixtureSchema>

export interface CompiledFirstModuleFixture {
  fixture: FirstModuleTechnicalFixture
  selectorResults: Array<{
    fixtureId: string
    selectorContractId: string
    count: number
    cardinalitySatisfied: boolean
  }>
  viewportBlockers: string[]
  success: boolean
}

export type CanonicalRelationId = z.infer<typeof AssemblyInterfaceIdSchema> | z.infer<typeof AssemblyDependencyIdSchema>
