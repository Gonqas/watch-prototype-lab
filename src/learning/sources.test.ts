import { describe, expect, it } from 'vitest'
import { SourceCitationSchema, sourceExportDisposition } from './sources'

describe('source authority', () => {
  it('requires calibre for official MIYOTA sources and ancestry for derived layers', () => {
    const base = {
      id: 'source-1', authority: 'official-miyota', usage: 'official-linked',
      resource: { kind: 'web-page', title: 'Official', locator: 'https://miyotamovement.com/product/8215/' },
      supportedClaim: 'Official calibre reference.', derivedLayer: 'source',
    }
    expect(SourceCitationSchema.safeParse(base).success).toBe(false)
    expect(SourceCitationSchema.safeParse({ ...base, calibre: '8215' }).success).toBe(true)
    expect(SourceCitationSchema.safeParse({ ...base, calibre: '8215', derivedLayer: 'educational' }).success).toBe(false)
  })

  it('applies conservative export defaults', () => {
    expect(sourceExportDisposition('shareable')).toBe('embed')
    expect(sourceExportDisposition('official-linked')).toBe('reference-only')
    expect(sourceExportDisposition('external-linked')).toBe('reference-only')
    expect(sourceExportDisposition('private-local')).toBe('exclude')
    expect(sourceExportDisposition('unknown')).toBe('exclude')
  })

  it('requires a hash before claiming an offline external copy', () => {
    const source = {
      id: 'source.external.test',
      authority: 'educational-secondary',
      usage: 'external-linked',
      resource: { kind: 'web-page', title: 'External', locator: 'https://example.com/' },
      authorityTier: 'D',
      sourceClass: 'educational-explainer',
      availability: 'online',
      checkedAt: '2026-08-02',
      rights: 'link-only',
      offlineReady: true,
      supportedClaim: 'A secondary explanation.',
      derivedLayer: 'source',
    }
    expect(SourceCitationSchema.safeParse(source).success).toBe(false)
    expect(SourceCitationSchema.safeParse({
      ...source,
      resource: { ...source.resource, sha256: 'a'.repeat(64) },
    }).success).toBe(true)
  })

  it('blocks obsolete hazardous procedures while preserving them as historical evidence', () => {
    const historical = {
      id: 'source.historical.cleaning',
      authority: 'government-primary',
      usage: 'private-local',
      resource: { kind: 'pdf', title: 'Historical cleaning manual', locator: 'manual.pdf', sha256: 'b'.repeat(64) },
      authorityTier: 'A',
      sourceClass: 'official-historical-primary',
      sourceType: 'official-historical-manual',
      availability: 'local',
      rights: 'user-supplied',
      offlineReady: true,
      currency: 'historical',
      historicalSafety: {
        status: 'prohibited-instruction',
        operationalUse: 'contextual-only',
        hazardTopics: ['carbon-tetrachloride'],
        reviewedAgainstModernGuidance: true,
        note: 'Se conserva para interpretar el documento, no para ejecutar el procedimiento.',
      },
      supportedClaim: 'Documenta una práctica histórica dentro de su fecha.',
      derivedLayer: 'source',
    }
    expect(SourceCitationSchema.safeParse(historical).success).toBe(false)
    expect(SourceCitationSchema.safeParse({
      ...historical,
      historicalSafety: { ...historical.historicalSafety, operationalUse: 'blocked' },
    }).success).toBe(true)
  })
})
