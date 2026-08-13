import { z } from 'zod'

export const sourceAuthorityValues = [
  'official-miyota',
  'manufacturer-primary',
  'government-primary',
  'official-standards-body',
  'technical-training',
  'reference-database',
  'expert-practice',
  'educational-secondary',
  'community-discovery',
  'physical-unit-observation',
  'own-observation',
  'own-measurement',
  'private-book-theory',
  'educational-derived',
  'original-educational',
] as const

export const sourceUsageValues = [
  'private-local',
  'official-linked',
  'external-linked',
  'official-cached',
  'user-created',
  'shareable',
  'unknown',
] as const

export const sourceAuthorityTierValues = ['A', 'B', 'C', 'D', 'E'] as const
export const sourceClassValues = [
  'official-primary',
  'institutional-training',
  'technical-reference',
  'expert-observation',
  'educational-explainer',
  'database-index',
  'historical-context',
  'official-historical-primary',
  'historical-training',
  'commercial-course',
  'community-discovery',
] as const
export const sourceAvailabilityValues = ['online', 'partial', 'legacy', 'unavailable', 'local'] as const
export const sourceRightsValues = [
  'link-only',
  'metadata-only',
  'local-private-copy',
  'permitted-cache',
  'user-supplied',
] as const

export const SourceAuthoritySchema = z.enum(sourceAuthorityValues)
export const SourceUsageSchema = z.enum(sourceUsageValues)
export const SourceAuthorityTierSchema = z.enum(sourceAuthorityTierValues)
export const SourceClassSchema = z.enum(sourceClassValues)
export const SourceAvailabilitySchema = z.enum(sourceAvailabilityValues)
export const SourceRightsSchema = z.enum(sourceRightsValues)

export const sourceCurrencyValues = ['current', 'historical', 'mixed', 'unknown'] as const
export const historicalSafetyStatusValues = [
  'current-reviewed',
  'historical-context-only',
  'modern-substitute-required',
  'supervised-only',
  'prohibited-instruction',
] as const
export const sourceOperationalUseValues = ['allowed', 'contextual-only', 'blocked'] as const
export const sourceHazardTopicValues = [
  'cyanide',
  'carbon-tetrachloride',
  'benzene-naphtha-gasoline',
  'radioactive-luminous-material',
  'strong-acid',
  'lead-heavy-metal',
  'open-flame-heat',
  'unknown-chemical',
  'rotating-machinery',
  'stored-energy',
] as const

export const SourceCurrencySchema = z.enum(sourceCurrencyValues)
export const HistoricalSafetyStatusSchema = z.enum(historicalSafetyStatusValues)
export const SourceOperationalUseSchema = z.enum(sourceOperationalUseValues)
export const SourceHazardTopicSchema = z.enum(sourceHazardTopicValues)

export type SourceAuthority = z.infer<typeof SourceAuthoritySchema>
export type SourceUsage = z.infer<typeof SourceUsageSchema>
export type SourceAuthorityTier = z.infer<typeof SourceAuthorityTierSchema>
export type SourceClass = z.infer<typeof SourceClassSchema>
export type SourceAvailability = z.infer<typeof SourceAvailabilitySchema>
export type SourceRights = z.infer<typeof SourceRightsSchema>

export const SourceResourceSchema = z.object({
  kind: z.enum(['web-page', 'pdf', 'book', 'archive', 'image', 'measurement', 'dataset', 'note']),
  title: z.string().min(1).max(240),
  locator: z.string().min(1).max(2048).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
}).strict()

export const SourceCitationSchema = z.object({
  id: z.string().min(1).max(160),
  authority: SourceAuthoritySchema,
  usage: SourceUsageSchema,
  resource: SourceResourceSchema,
  authorOrManufacturer: z.string().min(1).max(240).optional(),
  edition: z.string().min(1).max(160).optional(),
  year: z.number().int().min(1000).max(9999).optional(),
  sourceType: z.enum([
    'private-book',
    'official-miyota-documentation',
    'official-metrology-guidance',
    'own-observation',
    'own-measurement',
    'original-educational-content',
    'manufacturer-technical-documentation',
    'curated-external-resource',
    'expert-technical-article',
    'reference-database',
    'educational-visualization',
    'course-catalog',
    'historical-overview',
    'institutional-textbook',
    'historical-training-manual',
    'official-historical-manual',
    'archival-course',
  ]).optional(),
  calibre: z.string().min(1).max(80).optional(),
  movement: z.string().min(1).max(120).optional(),
  revision: z.string().min(1).max(120).optional(),
  chapter: z.string().min(1).max(240).optional(),
  page: z.string().min(1).max(80).optional(),
  figure: z.string().min(1).max(160).optional(),
  region: z.string().min(1).max(160).optional(),
  retrievedAt: z.string().min(10).optional(),
  importedAt: z.string().min(10).optional(),
  privateUse: z.boolean().optional(),
  editorialComment: z.string().min(1).max(4_000).optional(),
  authorityTier: SourceAuthorityTierSchema.optional(),
  sourceClass: SourceClassSchema.optional(),
  languages: z.array(z.string().min(2).max(16)).max(12).optional(),
  topics: z.array(z.string().min(1).max(120)).max(80).optional(),
  pedagogicalUses: z.array(z.enum([
    'discovery',
    'terminology',
    'theory',
    'visual-reference',
    'worked-example',
    'procedure-contrast',
    'calibre-identification',
    'historical-context',
  ])).max(16).optional(),
  availability: SourceAvailabilitySchema.optional(),
  checkedAt: z.string().min(10).optional(),
  rights: SourceRightsSchema.optional(),
  offlineReady: z.boolean().optional(),
  validationPolicy: z.string().min(1).max(2_000).optional(),
  limitations: z.array(z.string().min(1).max(1_000)).max(24).optional(),
  currency: SourceCurrencySchema.optional(),
  historicalSafety: z.object({
    status: HistoricalSafetyStatusSchema,
    operationalUse: SourceOperationalUseSchema,
    hazardTopics: z.array(SourceHazardTopicSchema).max(16).default([]),
    reviewedAgainstModernGuidance: z.boolean(),
    note: z.string().min(1).max(2_000),
  }).strict().optional(),
  supportedClaim: z.string().min(1).max(2000),
  derivedLayer: z.enum(['source', 'observation', 'interpretation', 'educational']).default('source'),
  originalSourceId: z.string().min(1).max(160).optional(),
}).strict().superRefine((citation, context) => {
  if (citation.derivedLayer !== 'source' && citation.authority !== 'original-educational' && !citation.originalSourceId) {
    context.addIssue({
      code: 'custom',
      path: ['originalSourceId'],
      message: 'Una capa derivada debe enlazar su fuente original.',
    })
  }
  if (citation.authority === 'official-miyota' && citation.calibre === undefined) {
    context.addIssue({ code: 'custom', path: ['calibre'], message: 'Una fuente oficial MIYOTA debe indicar calibre.' })
  }
  if (citation.offlineReady && !citation.resource.sha256 && citation.resource.kind !== 'note') {
    context.addIssue({
      code: 'custom',
      path: ['resource', 'sha256'],
      message: 'Una fuente marcada como disponible sin conexión debe fijar el hash de su copia local.',
    })
  }
  if (
    citation.authorityTier === 'A'
    && citation.sourceClass
    && !['official-primary', 'official-historical-primary'].includes(citation.sourceClass)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['sourceClass'],
      message: 'El nivel A se reserva para documentación primaria oficial.',
    })
  }
  if (
    citation.historicalSafety
    && ['modern-substitute-required', 'prohibited-instruction'].includes(citation.historicalSafety.status)
    && citation.historicalSafety.operationalUse !== 'blocked'
  ) {
    context.addIssue({
      code: 'custom',
      path: ['historicalSafety', 'operationalUse'],
      message: 'Una instrucción peligrosa u obsoleta debe permanecer bloqueada para uso operativo.',
    })
  }
  if (
    citation.currency === 'historical'
    && citation.historicalSafety?.status === 'current-reviewed'
  ) {
    context.addIssue({
      code: 'custom',
      path: ['historicalSafety', 'status'],
      message: 'Una fuente histórica no puede declararse globalmente como procedimiento vigente revisado.',
    })
  }
})

export type SourceResource = z.infer<typeof SourceResourceSchema>
export type SourceCitation = z.infer<typeof SourceCitationSchema>

export type ExportDisposition = 'embed' | 'reference-only' | 'exclude'

export function sourceExportDisposition(usage: SourceUsage): ExportDisposition {
  if (usage === 'shareable' || usage === 'user-created') return 'embed'
  if (usage === 'official-linked' || usage === 'external-linked') return 'reference-only'
  return 'exclude'
}
