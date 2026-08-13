import { strToU8, unzipSync, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { createRuntimeLearningPackFixture, RUNTIME_FIXTURE_ASSET } from '../fixtures/runtimeFixtures'
import {
  DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS,
  LearningPackageLoader,
  encodeLearningPackage,
  inspectLearningPackageZip,
} from './packageLoader'

function validBytes() {
  return encodeLearningPackage(createRuntimeLearningPackFixture(), [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }])
}

function markCentralDirectoryEntryAsSymlink(bytes: Uint8Array, entryName: string): Uint8Array {
  const result = bytes.slice()
  const view = new DataView(result.buffer, result.byteOffset, result.byteLength)
  for (let offset = 0; offset <= result.byteLength - 46; offset += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue
    const nameLength = view.getUint16(offset + 28, true)
    const name = new TextDecoder().decode(result.subarray(offset + 46, offset + 46 + nameLength))
    if (name !== entryName) continue
    view.setUint32(offset + 38, 0xa0000000, true)
    return result
  }
  throw new Error(`No se encontró ${entryName} en el directorio central del fixture.`)
}

describe('LearningPackageLoader ZIP security', () => {
  it('loads and validates a real integrated package from bytes', async () => {
    const result = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(validBytes())
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.value.pack.scenes).toHaveLength(4)
    expect(result.value.assets.get('asset.test-note')).toEqual(RUNTIME_FIXTURE_ASSET)
    expect(result.value.packageFingerprint).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('encodes identical logical packages to byte-identical ZIP containers', () => {
    expect(encodeLearningPackage(createRuntimeLearningPackFixture(), [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]))
      .toEqual(encodeLearningPackage(createRuntimeLearningPackFixture(), [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]))
  })

  it('loads explicitly supplied local-unsigned bytes without persistence', async () => {
    const pack = createRuntimeLearningPackFixture()
    pack.manifest.distribution = 'local-unsigned'
    const bytes = encodeLearningPackage(pack, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }])
    const result = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadLocalUnsigned(bytes)
    expect(result.success).toBe(true)
    if (result.success) expect(result.value.origin).toBe('local-unsigned')
  })

  it('rejects missing and ambiguous manifests', async () => {
    const loader = new LearningPackageLoader({ applicationVersion: '0.4.1' })
    const missing = await loader.loadIntegrated(zipSync({ 'content/x.json': strToU8('{}') }))
    expect(missing.success).toBe(false)
    const duplicate = await loader.loadIntegrated(zipSync({ 'manifest.json': strToU8('{}'), 'Manifest.json': strToU8('{}') }))
    expect(duplicate.success).toBe(false)
    if (!duplicate.success) expect(duplicate.diagnostics[0].message).toMatch(/duplicada|múltiples|ambigua/i)
  })

  it('rejects an incorrect required asset hash', async () => {
    const bytes = encodeLearningPackage(createRuntimeLearningPackFixture(), [{ assetId: 'asset.test-note', bytes: new TextEncoder().encode('fail') }])
    const result = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(bytes)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.diagnostics.map(({ code }) => code)).toContain('LR-PACKAGE-ASSET-HASH')
  })

  it('rejects traversal, absolute paths and Windows paths before inflation', () => {
    const limits = DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS
    expect(() => inspectLearningPackageZip(zipSync({ 'manifest.json': strToU8('{}'), '../evil.json': strToU8('{}') }), limits)).toThrow(/segura/)
    expect(() => inspectLearningPackageZip(zipSync({ 'manifest.json': strToU8('{}'), '/evil.json': strToU8('{}') }), limits)).toThrow(/segura/)
    expect(() => inspectLearningPackageZip(zipSync({ 'manifest.json': strToU8('{}'), 'C:\\evil.json': strToU8('{}') }), limits)).toThrow(/segura/)
  })

  it('rejects symbolic links declared through Unix ZIP attributes', () => {
    const bytes = zipSync({ 'manifest.json': strToU8('{}'), link: strToU8('manifest.json') })
    const symlinkBytes = markCentralDirectoryEntryAsSymlink(bytes, 'link')
    expect(() => inspectLearningPackageZip(symlinkBytes, DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS)).toThrow(/enlaces simbólicos/)
  })

  it('enforces entry count, individual and total uncompressed limits', () => {
    const bytes = validBytes()
    expect(() => inspectLearningPackageZip(bytes, { ...DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS, maximumEntryCount: 2 })).toThrow(/entradas/)
    expect(() => inspectLearningPackageZip(bytes, { ...DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS, maximumEntryUncompressedBytes: 10 })).toThrow(/individual/)
    expect(() => inspectLearningPackageZip(bytes, { ...DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS, maximumTotalUncompressedBytes: 100 })).toThrow(/total/)
  })

  it('rejects suspicious compression ratios and excessive archive path depth', () => {
    const bombLike = zipSync({ 'manifest.json': strToU8('x'.repeat(20_000)) }, { level: 9 })
    expect(() => inspectLearningPackageZip(bombLike, { ...DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS, maximumCompressionRatio: 2 })).toThrow(/compresión/)
    const deep = zipSync({ 'manifest.json': strToU8('{}'), 'a/b/c/d/e.json': strToU8('{}') })
    expect(() => inspectLearningPackageZip(deep, { ...DEFAULT_LEARNING_PACKAGE_ZIP_LIMITS, maximumPathDepth: 3 })).toThrow(/profundidad/)
  })

  it('rejects excessive JSON depth after bounded inflation', async () => {
    const loader = new LearningPackageLoader({ applicationVersion: '0.4.1', limits: { maximumJsonDepth: 3 } })
    const result = await loader.loadIntegrated(validBytes())
    expect(result.success).toBe(false)
    if (!result.success) expect(result.diagnostics.some(({ technicalDetail }) => technicalDetail?.includes('depth-limit'))).toBe(true)
  })

  it('rejects broken internal references and missing required assets', async () => {
    const files = unzipSync(validBytes())
    delete files['content/scenes/scene.v5-reversible.json']
    delete files['assets/9f86d081884c7d659a2feaa0c55ad015.txt']
    const result = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(zipSync(files))
    expect(result.success).toBe(false)
  })

  it('executes the published JSON Schema before runtime semantic validation', async () => {
    const files = unzipSync(validBytes())
    const manifest = JSON.parse(new TextDecoder().decode(files['manifest.json'])) as Record<string, unknown>
    delete manifest.schemaId
    files['manifest.json'] = strToU8(JSON.stringify(manifest))
    const result = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(zipSync(files))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.diagnostics.map(({ code }) => code)).toContain('LR-PACKAGE-JSON-SCHEMA')
  })

  it('enforces minimum and maximum compatible application SemVer', async () => {
    const tooNew = createRuntimeLearningPackFixture()
    tooNew.manifest.minimumAppVersion = '9.0.0'
    const newResult = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(encodeLearningPackage(tooNew, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]))
    expect(newResult.success).toBe(false)
    const tooOld = createRuntimeLearningPackFixture()
    tooOld.manifest.maximumAppVersion = '0.3.0'
    const oldResult = await new LearningPackageLoader({ applicationVersion: '0.4.1' }).loadIntegrated(encodeLearningPackage(tooOld, [{ assetId: 'asset.test-note', bytes: RUNTIME_FIXTURE_ASSET }]))
    expect(oldResult.success).toBe(false)
  })
})
