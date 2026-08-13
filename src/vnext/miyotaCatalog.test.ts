import { describe, expect, it } from 'vitest'
import { evaluateProject } from './engine'
import { MIYOTA_OFFICIAL_MOVEMENTS, miyotaMovement, miyotaSourceReferences } from './miyotaCatalog'
import { createMiyotaMechanicalStudy } from './presets'

describe('official MIYOTA catalogue', () => {
  it('keeps every curated locator on the official HTTPS domain', () => {
    for (const movement of MIYOTA_OFFICIAL_MOVEMENTS) {
      expect(new URL(movement.productUrl).hostname).toBe('miyotamovement.com')
      for (const locator of Object.values(movement.documents)) {
        if (!locator) continue
        const url = new URL(locator)
        expect(url.protocol).toBe('https:')
        expect(url.hostname).toBe('miyotamovement.com')
      }
    }
  })

  it('registers complete official document sets for the two mechanical donor studies', () => {
    for (const calibre of ['8215', '9015'] as const) {
      const movement = miyotaMovement(calibre)
      expect(Object.keys(movement.documents).sort()).toEqual(['drawing', 'instruction', 'partsList', 'specification'])
      expect(miyotaSourceReferences(movement)).toHaveLength(5)
    }
  })

  it('creates a traceable but deliberately unassigned 8215 scratch movement', () => {
    const project = createMiyotaMechanicalStudy('8215')
    expect(project.movement.kind).toBe('mechanical')
    if (project.movement.kind !== 'mechanical') return

    expect(project.movement.buildMode).toBe('scratch')
    expect(project.movement.componentOrigins).toEqual({})
    expect(project.movement.referenceCalibre).toBe('MIYOTA 8215')
    expect(project.movement.referenceSources).toHaveLength(5)
    expect(project.movement.plateDiameter.value).toBe(26)
    expect(project.movement.totalHeight.value).toBe(5.67)
    expect(project.movement.escapement.targetVph.value).toBe(21600)
    expect(project.movement.escapement.liftAngle.value).toBe(49)
    expect(project.movement.targetPowerReserve.value).toBe(42)
    expect(project.movement.barrelTurns.value).toBeCloseTo(5.25, 6)
    expect(evaluateProject(project).train?.powerReserveHours).toBeCloseTo(42, 6)
    expect(project.notes).toContain('Ningun componente interno se considera compatible')
  })
})
