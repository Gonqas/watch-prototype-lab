import { strToU8, unzipSync, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { decodeWatchPackage, encodeWatchPackage } from '../platform/native'
import { createV5ProjectFixture } from './fixtures/canonicalFixtures'
import {
  DEFAULT_LEARNING_EXPORT_EXCLUSIONS,
  LearningDossierManifestSchema,
  createLearningDossierManifest,
} from './portability'

describe('.wplab additive learning compatibility', () => {
  it('builds an explicit dossier and excludes private/global data by default', () => {
    const manifest = createLearningDossierManifest(
      { id: 'project-1', fingerprint: 'fnv1a64:abc' },
      { packageReferences: [{ id: 'pack-1', version: '1.0.0' }], sessionIds: ['session-1'], evidenceIds: ['evidence-1'] },
      '2026-07-22T09:00:00.000Z',
    )
    expect(LearningDossierManifestSchema.safeParse(manifest).success).toBe(true)
    expect(manifest.exclusions).toEqual(DEFAULT_LEARNING_EXPORT_EXCLUSIONS)
    expect(manifest.sessionReferences[0].entry).toBe('learning/sessions/session-1.json')
  })

  it('proves the current package reader ignores an optional future learning entry', () => {
    const project = createV5ProjectFixture()
    const entries = unzipSync(encodeWatchPackage(project))
    entries['learning/dossier.json'] = strToU8(JSON.stringify({ format: 'wplab-learning-dossier', formatVersion: 1 }))
    const decoded = decodeWatchPackage(zipSync(entries))
    expect(decoded.project).toEqual(project)
    expect(decoded.manifest.packageVersion).toBe(1)
  })
})
