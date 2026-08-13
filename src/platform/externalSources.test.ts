import { describe, expect, it } from 'vitest'
import { authorizeExternalSourceUrl } from './externalSources'

describe('external source registry', () => {
  it('accepts an explicit HTTPS URL from its registered manufacturer', () => {
    expect(authorizeExternalSourceUrl('https://miyotamovement.com/product/2035/', 'miyota-official').hostname)
      .toBe('miyotamovement.com')
  })

  it('supports registered sources beyond MIYOTA', () => {
    expect(authorizeExternalSourceUrl('https://www.bipm.org/en/publications/si-brochure', 'bipm-official').hostname)
      .toBe('www.bipm.org')
  })

  it.each([
    ['http://miyotamovement.com/product/2035/', 'miyota-official'],
    ['https://miyotamovement.com@example.invalid/', 'miyota-official'],
    ['file:///C:/private.pdf', 'miyota-official'],
    ['javascript:alert(1)', 'miyota-official'],
  ])('rejects dangerous or misleading URLs', (url, sourceId) => {
    expect(() => authorizeExternalSourceUrl(url, sourceId)).toThrow()
  })
})
