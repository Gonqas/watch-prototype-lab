import { describe, expect, it } from 'vitest'
import { detectSupportedImageMediaType } from './webImageImporter'

describe('web metrology image validation', () => {
  it('detects supported formats from their signatures instead of the extension', () => {
    expect(detectSupportedImageMediaType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe('image/jpeg')
    expect(detectSupportedImageMediaType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(detectSupportedImageMediaType(new TextEncoder().encode('RIFF0000WEBP'))).toBe('image/webp')
  })

  it('rejects renamed or unsupported files', () => {
    expect(() => detectSupportedImageMediaType(new TextEncoder().encode('not-an-image'))).toThrow(/JPEG, PNG o WebP/)
  })
})
