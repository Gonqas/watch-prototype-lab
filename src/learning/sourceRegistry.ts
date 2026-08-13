import { z } from 'zod'
import registryInput from '../../learning-content/source-registry/horology-student-resources.v1.json'
import {
  SourceAuthorityTierSchema,
  SourceCitationSchema,
  SourceClassSchema,
  type SourceAuthorityTier,
  type SourceCitation,
  type SourceClass,
} from './sources'

export const CuratedSourceRegistrySchema = z.object({
  id: z.string().min(1).max(160),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: z.string().min(1).max(240),
  curator: z.string().min(1).max(240),
  checkedAt: z.string().min(10),
  discoverySource: z.string().url(),
  policy: z.object({
    runtimeNetworkDependency: z.literal(false),
    claimAuthorityNeverExceedsSource: z.literal(true),
    localCopiesRequireHash: z.literal(true),
  }).strict(),
  entries: z.array(SourceCitationSchema).min(1),
}).strict().superRefine((registry, context) => {
  const ids = registry.entries.map(({ id }) => id)
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: 'custom', path: ['entries'], message: 'El registro no admite IDs duplicados.' })
  }
  for (const [index, entry] of registry.entries.entries()) {
    if (!entry.authorityTier || !entry.sourceClass || !entry.availability || !entry.rights || !entry.checkedAt) {
      context.addIssue({
        code: 'custom',
        path: ['entries', index],
        message: 'Una fuente curada debe declarar nivel, clase, disponibilidad, derechos y fecha de revisión.',
      })
    }
  }
})

export type CuratedSourceRegistry = z.infer<typeof CuratedSourceRegistrySchema>

export const CURATED_HOROLOGY_SOURCE_REGISTRY = CuratedSourceRegistrySchema.parse(registryInput)

export interface CuratedSourceQuery {
  authorityTier?: SourceAuthorityTier
  sourceClass?: SourceClass
  topic?: string
  pedagogicalUse?: NonNullable<SourceCitation['pedagogicalUses']>[number]
  onlineOnly?: boolean
}

export function queryCuratedSources(query: CuratedSourceQuery = {}): SourceCitation[] {
  const normalizedTopic = query.topic?.trim().toLocaleLowerCase('es')
  return CURATED_HOROLOGY_SOURCE_REGISTRY.entries
    .filter((source) => !query.authorityTier || source.authorityTier === query.authorityTier)
    .filter((source) => !query.sourceClass || source.sourceClass === query.sourceClass)
    .filter((source) => !normalizedTopic || (source.topics ?? []).some((topic) => topic.toLocaleLowerCase('es').includes(normalizedTopic)))
    .filter((source) => !query.pedagogicalUse || (source.pedagogicalUses ?? []).includes(query.pedagogicalUse))
    .filter((source) => !query.onlineOnly || source.availability === 'online')
    .map((source) => structuredClone(source))
}

export function sourceRegistrySummary(): {
  total: number
  byTier: Record<SourceAuthorityTier, number>
  byClass: Record<SourceClass, number>
  legacy: number
  unavailable: number
} {
  const byTier = Object.fromEntries(SourceAuthorityTierSchema.options.map((tier) => [tier, 0])) as Record<SourceAuthorityTier, number>
  const byClass = Object.fromEntries(SourceClassSchema.options.map((sourceClass) => [sourceClass, 0])) as Record<SourceClass, number>
  for (const source of CURATED_HOROLOGY_SOURCE_REGISTRY.entries) {
    if (source.authorityTier) byTier[source.authorityTier] += 1
    if (source.sourceClass) byClass[source.sourceClass] += 1
  }
  return {
    total: CURATED_HOROLOGY_SOURCE_REGISTRY.entries.length,
    byTier,
    byClass,
    legacy: CURATED_HOROLOGY_SOURCE_REGISTRY.entries.filter(({ availability }) => availability === 'legacy').length,
    unavailable: CURATED_HOROLOGY_SOURCE_REGISTRY.entries.filter(({ availability }) => availability === 'unavailable').length,
  }
}
