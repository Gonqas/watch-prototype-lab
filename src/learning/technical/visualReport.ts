import { z } from 'zod'
import { TechnicalMovementFixtureSchema, type TechnicalMovementFixture } from './reconstruction'
import {
  FIRST_MODULE_TECHNICAL_FIXTURE,
  TECHNICAL_MOVEMENT_FIXTURES,
  compileFirstModuleTechnicalFixture,
} from './fixtures'
import { MIYOTA_OFFICIAL_SOURCE_REGISTRY } from './officialSources'

const VisualReportFixtureSchema = z.object({
  resource: z.string().min(1),
  fixtureId: z.string().min(1),
  fixtureVersion: z.string().min(1),
  kind: z.string().min(1),
  selectorContracts: z.array(z.object({
    id: z.string().min(1),
    selector: z.unknown(),
    expectedCardinality: z.unknown(),
    resolvedCount: z.number().int().nonnegative(),
    cardinalitySatisfied: z.boolean(),
  }).strict()),
  availableParts: z.array(z.object({
    canonicalId: z.string().min(1),
    nameEs: z.string().min(1),
    nameEn: z.string().min(1),
    officialReference: z.string().optional(),
    modelState: z.string().min(1),
    reconstructionLevel: z.string().min(1),
    geometryPrimitiveCount: z.number().int().nonnegative(),
  }).strict()),
  missingPartRoles: z.array(z.string()),
  reconstructionLevel: z.string().min(1),
  sourceIds: z.array(z.string()),
  officialDataCount: z.number().int().nonnegative(),
  estimatedDataCount: z.number().int().nonnegative(),
  measuredDataCount: z.number().int().nonnegative(),
  fidelity: z.unknown(),
  viewportCapabilities: z.array(z.unknown()),
  visualErrorScenarios: z.array(z.unknown()),
  blockers: z.array(z.string()),
  limitations: z.array(z.string()),
}).strict()

export const TechnicalVisualReportSchema = z.object({
  schemaVersion: z.literal(1),
  reportId: z.literal('report.learning.sistema4b.visual'),
  generatedAt: z.string().min(10),
  moduleFixtureId: z.string().min(1),
  moduleFixtureCompiled: z.boolean(),
  moduleViewportBlockers: z.array(z.string()),
  fixtures: z.array(VisualReportFixtureSchema).length(4),
}).strict()

export type TechnicalVisualReport = z.infer<typeof TechnicalVisualReportSchema>

export function createTechnicalVisualReport(
  fixtures: TechnicalMovementFixture[] = [...TECHNICAL_MOVEMENT_FIXTURES],
  generatedAt = new Date().toISOString(),
): TechnicalVisualReport {
  fixtures.forEach((fixture) => TechnicalMovementFixtureSchema.parse(fixture))
  const compiled = compileFirstModuleTechnicalFixture()
  const compiledByFixture = new Map<string, Map<string, { count: number; cardinalitySatisfied: boolean }>>()
  compiled.selectorResults.forEach((result) => {
    const contracts = compiledByFixture.get(result.fixtureId) ?? new Map()
    contracts.set(result.selectorContractId, {
      count: result.count,
      cardinalitySatisfied: result.cardinalitySatisfied,
    })
    compiledByFixture.set(result.fixtureId, contracts)
  })

  return TechnicalVisualReportSchema.parse({
    schemaVersion: 1,
    reportId: 'report.learning.sistema4b.visual',
    generatedAt,
    moduleFixtureId: FIRST_MODULE_TECHNICAL_FIXTURE.id,
    moduleFixtureCompiled: compiled.success,
    moduleViewportBlockers: compiled.viewportBlockers,
    fixtures: fixtures.map((fixture) => {
      const registryFactCount = MIYOTA_OFFICIAL_SOURCE_REGISTRY.entries
        .find(({ calibre, status }) => status === 'curated' && calibre === fixture.calibre)
        ?.facts.length ?? 0
      const officialDataCount = registryFactCount
        + fixture.ledger.reduce((sum, part) => sum + part.officialDimensions.length, 0)
      const estimatedDataCount = fixture.ledger.reduce((sum, part) => sum + part.estimatedDimensions.length, 0)
        + fixture.geometry.filter(({ layer }) => layer === 'visual-reconstruction-estimate').length
      const measuredDataCount = fixture.ledger.reduce((sum, part) => sum + part.measuredDimensions.length, 0)
      const blockers = [
        ...fixture.capabilities
          .filter(({ status }) => status === 'unavailable')
          .map(({ id, explanation }) => `${id}: ${explanation}`),
        ...fixture.missingPartRoles.map((role) => `Pieza o rol ausente: ${role}`),
      ]
      return {
        resource: `${fixture.kind}:${fixture.calibre ?? fixture.variant}`,
        fixtureId: fixture.id,
        fixtureVersion: fixture.version,
        kind: fixture.kind,
        selectorContracts: fixture.selectors.map((contract) => {
          const result = compiledByFixture.get(fixture.id)?.get(contract.id)
          return {
            id: contract.id,
            selector: contract.selector,
            expectedCardinality: contract.cardinality,
            resolvedCount: result?.count ?? 0,
            cardinalitySatisfied: result?.cardinalitySatisfied ?? false,
          }
        }),
        availableParts: fixture.ledger.map((part) => ({
          canonicalId: part.canonicalId,
          nameEs: part.nameEs,
          nameEn: part.nameEn,
          ...(part.officialReference ? { officialReference: part.officialReference } : {}),
          modelState: part.modelState,
          reconstructionLevel: part.reconstructionLevel,
          geometryPrimitiveCount: part.geometryPrimitiveIds.length,
        })),
        missingPartRoles: fixture.missingPartRoles,
        reconstructionLevel: fixture.reconstructionLevel,
        sourceIds: fixture.sourceIds,
        officialDataCount,
        estimatedDataCount,
        measuredDataCount,
        fidelity: fixture.fidelity,
        viewportCapabilities: fixture.capabilities,
        visualErrorScenarios: fixture.visualErrorScenarios,
        blockers,
        limitations: fixture.limitations,
      }
    }),
  })
}

export function renderTechnicalVisualReportMarkdown(report: TechnicalVisualReport): string {
  const lines = [
    '# Informe visual técnico · Sistema 4B',
    '',
    `Generado: ${report.generatedAt}`,
    '',
    `Fixture coordinado: \`${report.moduleFixtureId}\` · compilación técnica: **${report.moduleFixtureCompiled ? 'correcta' : 'fallida'}**.`,
    '',
    'Este informe describe datos y capacidades técnicas. No contiene lecciones, explicaciones pedagógicas, preguntas ni rúbricas.',
    '',
  ]
  for (const fixture of report.fixtures) {
    lines.push(
      `## ${fixture.resource}`,
      '',
      `- Fixture: \`${fixture.fixtureId}@${fixture.fixtureVersion}\``,
      `- Reconstrucción: **${fixture.reconstructionLevel}**`,
      `- Piezas registradas: **${fixture.availableParts.length}**`,
      `- Selectores: **${fixture.selectorContracts.length}** (${fixture.selectorContracts.filter(({ cardinalitySatisfied }) => cardinalitySatisfied).length} válidos)`,
      `- Datos oficiales / estimados / medidos: **${fixture.officialDataCount} / ${fixture.estimatedDataCount} / ${fixture.measuredDataCount}**`,
      `- G/K/P: **${String((fixture.fidelity as { geometry?: string }).geometry ?? '?')}/${String((fixture.fidelity as { kinematics?: string }).kinematics ?? '?')}/${String((fixture.fidelity as { physics?: string }).physics ?? '?')}**`,
      `- Errores visuales controlados: **${fixture.visualErrorScenarios.length}**`,
      '',
      '### Bloqueos',
      '',
      ...(fixture.blockers.length > 0 ? fixture.blockers.map((blocker) => `- ${blocker}`) : ['- Ninguno declarado.']),
      '',
      '### Limitaciones',
      '',
      ...fixture.limitations.map((limitation) => `- ${limitation}`),
      '',
    )
  }
  lines.push(
    '## Bloqueos de la composición coordinada',
    '',
    ...(report.moduleViewportBlockers.length > 0
      ? report.moduleViewportBlockers.map((blocker) => `- \`${blocker}\``)
      : ['- Ninguno declarado.']),
    '',
  )
  return `${lines.join('\n')}\n`
}
