import { describe, expect, it } from 'vitest'
import { PersistentLearningSessionSchema } from './models'
import { sessionFixture } from './testFixtures'

describe('contrato persistente de modos de aprendizaje', () => {
  it('serializa demonstration sin cambiar el esquema ni perder datos', () => {
    const source = { ...sessionFixture(), learningMode: 'demonstration' as const }
    const restored = PersistentLearningSessionSchema.parse(JSON.parse(JSON.stringify(source)))

    expect(restored).toEqual(source)
    expect(restored.schemaVersion).toBe(1)
    expect(restored.learningMode).toBe('demonstration')
  })

  it('sigue aceptando sesiones anteriores que no guardaban learningMode', () => {
    const legacy = sessionFixture()
    delete legacy.learningMode

    expect(PersistentLearningSessionSchema.parse(legacy)).toEqual(legacy)
  })
})
