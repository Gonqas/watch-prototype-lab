import { describe, expect, it } from 'vitest'
import { calculateWeibullReliability } from './calculators'
import { readEngineeringNotebook, removeEngineeringRun, saveEngineeringRun } from './notebook'
import { quantity } from './units'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
  }
}

describe('engineering notebook', () => {
  it('persists versioned calculation evidence per project', () => {
    const storage = memoryStorage()
    const run = calculateWeibullReliability({
      time: quantity(100, 'h'),
      scale: quantity(1000, 'h'),
      shape: quantity(1.5, 'ratio'),
    })
    saveEngineeringRun('project-a', run, storage)
    expect(readEngineeringNotebook('project-a', storage).runs).toHaveLength(1)
    expect(readEngineeringNotebook('project-a', storage).runs[0].domain).toContain('t ≥ 0')
    expect(readEngineeringNotebook('project-b', storage).runs).toHaveLength(0)
    removeEngineeringRun('project-a', run.id, storage)
    expect(readEngineeringNotebook('project-a', storage).runs).toHaveLength(0)
  })
})
