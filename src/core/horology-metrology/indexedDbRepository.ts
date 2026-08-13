import { LEARNING_INDEXED_DB_VERSION, METROLOGY_STORE_NAMES } from '../../learning/persistence/indexedDbRepository'
import type {
  HorologyMetrologyRepository,
  MetrologyPage,
  MetrologyQuery,
  MetrologyRecordMap,
  MetrologyRecordType,
} from './persistence'

const METROLOGY_STORE_SET = new Set<string>(METROLOGY_STORE_NAMES)

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('La operación IndexedDB de metrología ha fallado.'))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('La transacción IndexedDB de metrología fue cancelada.'))
    transaction.onerror = () => reject(transaction.error ?? new Error('La transacción IndexedDB de metrología ha fallado.'))
  })
}

function assertRecordType(type: string): asserts type is MetrologyRecordType {
  if (!METROLOGY_STORE_SET.has(type)) throw new Error(`Tipo de registro de metrología no permitido: ${type}`)
}

function stringField(record: object, key: string): string | undefined {
  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}

export class IndexedDbHorologyMetrologyRepository implements HorologyMetrologyRepository {
  private database?: IDBDatabase
  private readonly databaseName: string
  private readonly factory: IDBFactory

  constructor(
    databaseName = 'watch-prototype-lab-learning',
    factory: IDBFactory = globalThis.indexedDB,
  ) {
    if (!factory) throw new Error('IndexedDB no está disponible.')
    this.databaseName = databaseName
    this.factory = factory
  }

  async initialize(): Promise<void> {
    if (this.database) return
    const request = this.factory.open(this.databaseName, LEARNING_INDEXED_DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('meta')) database.createObjectStore('meta', { keyPath: 'key' })
      for (const storeName of METROLOGY_STORE_NAMES) {
        if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'id' })
      }
    }
    this.database = await requestResult(request)
  }

  async close(): Promise<void> {
    this.database?.close()
    this.database = undefined
  }

  async put<K extends MetrologyRecordType>(type: K, value: MetrologyRecordMap[K]): Promise<void> {
    assertRecordType(type)
    const transaction = this.requiredDatabase().transaction(type, 'readwrite')
    transaction.objectStore(type).put(structuredClone(value))
    await transactionComplete(transaction)
  }

  async get<K extends MetrologyRecordType>(type: K, id: string): Promise<MetrologyRecordMap[K] | undefined> {
    assertRecordType(type)
    const transaction = this.requiredDatabase().transaction(type, 'readonly')
    const value = await requestResult(transaction.objectStore(type).get(id))
    await transactionComplete(transaction)
    return value ? structuredClone(value as MetrologyRecordMap[K]) : undefined
  }

  async list<K extends MetrologyRecordType>(type: K, query: MetrologyQuery = {}): Promise<MetrologyPage<MetrologyRecordMap[K]>> {
    assertRecordType(type)
    const transaction = this.requiredDatabase().transaction(type, 'readonly')
    const values = await requestResult(transaction.objectStore(type).getAll()) as MetrologyRecordMap[K][]
    await transactionComplete(transaction)
    const filtered = values.filter((record) =>
      (!query.profileId || stringField(record, 'profileId') === query.profileId)
      && (!query.specimenId || stringField(record, 'specimenId') === query.specimenId)
      && (!query.ownerId || [stringField(record, 'ownerId'), stringField(record, 'sessionId'), stringField(record, 'seriesId'), stringField(record, 'imageAssetId'), stringField(record, 'instrumentId')].includes(query.ownerId)))
      .toSorted((left, right) => stringField(right, 'updatedAt')?.localeCompare(stringField(left, 'updatedAt') ?? '') ?? 0)
    const offset = Math.max(0, query.offset ?? 0)
    const limit = Math.min(250, Math.max(1, query.limit ?? 50))
    return { items: structuredClone(filtered.slice(offset, offset + limit)), total: filtered.length, offset, limit }
  }

  async removeReference(referenceId: string): Promise<void> {
    const type = 'object_store_references'
    const transaction = this.requiredDatabase().transaction(type, 'readwrite')
    transaction.objectStore(type).delete(referenceId)
    await transactionComplete(transaction)
  }

  private requiredDatabase(): IDBDatabase {
    if (!this.database) throw new Error('El repositorio IndexedDB de metrología no está inicializado.')
    return this.database
  }
}
