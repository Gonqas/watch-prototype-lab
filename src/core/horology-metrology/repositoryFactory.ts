import { isNativeApp } from '../../platform/native'
import { IndexedDbHorologyMetrologyRepository } from './indexedDbRepository'
import { NativeHorologyMetrologyRepository } from './nativeRepository'
import type { HorologyMetrologyRepository } from './persistence'

export async function createHorologyMetrologyRepository(): Promise<HorologyMetrologyRepository> {
  const repository: HorologyMetrologyRepository = isNativeApp()
    ? new NativeHorologyMetrologyRepository()
    : new IndexedDbHorologyMetrologyRepository()
  await repository.initialize()
  return repository
}
