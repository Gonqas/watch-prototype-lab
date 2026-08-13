import { describe, expect, it } from 'vitest'
import { createMechanicalProject } from '../vnext/presets'
import { decodeWatchPackage, encodeWatchPackage } from './native'

describe('Watch Prototype Lab package', () => {
  it('round-trips a versioned project and optional CAD report', () => {
    const project = createMechanicalProject()
    const bytes = encodeWatchPackage(project, {
      parts: [],
      collisions: [],
      minimumClearanceMm: 0.42,
      invalidParts: [],
    })
    const decoded = decodeWatchPackage(bytes)

    expect(decoded.manifest.format).toBe('watch-prototype-lab')
    expect(decoded.project.id).toBe(project.id)
    expect(decoded.project.schemaVersion).toBe(5)
    expect(decoded.cadAnalysis?.minimumClearanceMm).toBe(0.42)
  })
})
