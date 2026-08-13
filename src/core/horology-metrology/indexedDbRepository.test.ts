import { IDBFactory } from 'fake-indexeddb'
import { describe, expect, it } from 'vitest'
import { IndexedDbHorologyMetrologyRepository } from './indexedDbRepository'
import type { PhysicalSpecimen } from './specimens'

const timestamp = '2026-08-02T10:00:00.000Z'

function specimen(id: string): PhysicalSpecimen {
  return {
    schemaVersion: 1,
    id,
    profileId: 'profile.local',
    stableIdentifier: id,
    displayName: 'Unidad física',
    kind: 'movement',
    ownership: 'owned',
    condition: 'as-received',
    notes: '',
    tags: [],
    linkedProjectIds: [],
    linkedFixtureIds: [],
    privacy: 'private',
    createdAt: timestamp,
    updatedAt: timestamp,
    recordVersion: 1,
  }
}

describe('IndexedDB horology metrology repository', () => {
  it('stores and pages specimens in the existing learning database contract', async () => {
    const repository = new IndexedDbHorologyMetrologyRepository('metrology-test', new IDBFactory())
    await repository.initialize()
    await repository.put('physical_specimens', specimen('metrology.specimen.one'))
    await repository.put('physical_specimens', specimen('metrology.specimen.two'))
    expect((await repository.get('physical_specimens', 'metrology.specimen.one'))?.displayName).toBe('Unidad física')
    const page = await repository.list('physical_specimens', { profileId: 'profile.local', limit: 1 })
    expect(page.total).toBe(2)
    expect(page.items).toHaveLength(1)
    await repository.close()
  })

  it('rejects non-whitelisted stores', async () => {
    const repository = new IndexedDbHorologyMetrologyRepository('metrology-invalid', new IDBFactory())
    await repository.initialize()
    await expect(repository.list('unknown' as 'physical_specimens')).rejects.toThrow(/no permitido/)
    await repository.close()
  })
})
