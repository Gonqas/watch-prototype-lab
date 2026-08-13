import { invokeLearningNative } from '../../platform/native'

export interface LearningBinaryStorage {
  stage(hash: string, bytes: Uint8Array): Promise<string>
  commit(hash: string): Promise<string>
  rollback(hash: string): Promise<void>
  read(hash: string): Promise<Uint8Array | undefined>
  remove(hash: string): Promise<void>
}

interface NativeBinaryGateway {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>
}

export class NativeLearningBinaryStorage implements LearningBinaryStorage {
  private readonly gateway: NativeBinaryGateway
  private readonly stagedTokens = new Map<string, string>()

  constructor(gateway: NativeBinaryGateway = { invoke: invokeLearningNative }) {
    this.gateway = gateway
  }

  async stage(hash: string, bytes: Uint8Array): Promise<string> {
    const token = await this.gateway.invoke<string>('learning_stage_binary_native', {
      bytes: Array.from(bytes),
      expectedHash: hash,
    })
    this.stagedTokens.set(hash, token)
    return `native:staging/${token}`
  }

  async commit(hash: string): Promise<string> {
    const token = this.stagedTokens.get(hash)
    if (!token) throw new Error(`No existe staging nativo para ${hash}.`)
    const reference = await this.gateway.invoke<string>('learning_commit_binary_native', {
      token,
      expectedHash: hash,
    })
    this.stagedTokens.delete(hash)
    return reference
  }

  async rollback(hash: string): Promise<void> {
    const token = this.stagedTokens.get(hash)
    if (!token) return
    await this.gateway.invoke<void>('learning_rollback_binary_native', { token })
    this.stagedTokens.delete(hash)
  }

  async read(hash: string): Promise<Uint8Array | undefined> {
    try {
      const bytes = await this.gateway.invoke<number[]>('learning_read_binary_native', {
        reference: `native:sha256/${hash.slice('sha256:'.length)}`,
      })
      return Uint8Array.from(bytes)
    } catch {
      return undefined
    }
  }

  async remove(hash: string): Promise<void> {
    await this.rollback(hash)
    await this.gateway.invoke<void>('learning_remove_binary_native', {
      reference: `native:sha256/${hash.slice('sha256:'.length)}`,
    })
  }
}

export class MemoryLearningBinaryStorage implements LearningBinaryStorage {
  private readonly staged = new Map<string, Uint8Array>()
  private readonly committed = new Map<string, Uint8Array>()

  async stage(hash: string, bytes: Uint8Array): Promise<string> {
    const existing = this.committed.get(hash)
    if (existing && !sameBytes(existing, bytes)) throw new Error(`Colisión de contenido para ${hash}.`)
    this.staged.set(hash, bytes.slice())
    return `memory:staging/${hash}`
  }

  async commit(hash: string): Promise<string> {
    const bytes = this.staged.get(hash)
    if (!bytes && !this.committed.has(hash)) throw new Error(`No existe staging para ${hash}.`)
    if (bytes) this.committed.set(hash, bytes)
    this.staged.delete(hash)
    return `memory:sha256/${hash.slice('sha256:'.length)}`
  }

  async rollback(hash: string): Promise<void> {
    this.staged.delete(hash)
  }

  async read(hash: string): Promise<Uint8Array | undefined> {
    return this.committed.get(hash)?.slice()
  }

  async remove(hash: string): Promise<void> {
    this.staged.delete(hash)
    this.committed.delete(hash)
  }

  hasStaging(hash: string): boolean {
    return this.staged.has(hash)
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false
  return left.every((byte, index) => byte === right[index])
}

export class IndexedDbLearningBinaryStorage implements LearningBinaryStorage {
  private readonly databaseName: string
  private readonly factory: IDBFactory
  private database?: IDBDatabase

  constructor(databaseName = 'watch-prototype-lab-learning-binaries', factory: IDBFactory = globalThis.indexedDB) {
    this.databaseName = databaseName
    this.factory = factory
  }

  async initialize(): Promise<void> {
    if (this.database) return
    const request = this.factory.open(this.databaseName, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('staging')) request.result.createObjectStore('staging')
      if (!request.result.objectStoreNames.contains('content')) request.result.createObjectStore('content')
    }
    this.database = await requestValue(request)
  }

  async close(): Promise<void> {
    this.database?.close()
    this.database = undefined
  }

  async stage(hash: string, bytes: Uint8Array): Promise<string> {
    await this.put('staging', hash, bytes)
    return `indexeddb:staging/${hash}`
  }

  async commit(hash: string): Promise<string> {
    const bytes = await this.get('staging', hash)
    if (!bytes && !await this.get('content', hash)) throw new Error(`No existe staging para ${hash}.`)
    const transaction = this.required().transaction(['staging', 'content'], 'readwrite')
    if (bytes) transaction.objectStore('content').put(bytes, hash)
    transaction.objectStore('staging').delete(hash)
    await transactionDone(transaction)
    return `indexeddb:sha256/${hash.slice('sha256:'.length)}`
  }

  async rollback(hash: string): Promise<void> { await this.delete('staging', hash) }
  async read(hash: string): Promise<Uint8Array | undefined> { return this.get('content', hash) }
  async remove(hash: string): Promise<void> {
    await Promise.all([this.delete('staging', hash), this.delete('content', hash)])
  }

  private async put(store: string, key: string, bytes: Uint8Array): Promise<void> {
    const transaction = this.required().transaction(store, 'readwrite')
    transaction.objectStore(store).put(bytes.slice(), key)
    await transactionDone(transaction)
  }

  private async get(store: string, key: string): Promise<Uint8Array | undefined> {
    const transaction = this.required().transaction(store, 'readonly')
    const result = await requestValue(transaction.objectStore(store).get(key)) as Uint8Array | undefined
    await transactionDone(transaction)
    return result?.slice()
  }

  private async delete(store: string, key: string): Promise<void> {
    const transaction = this.required().transaction(store, 'readwrite')
    transaction.objectStore(store).delete(key)
    await transactionDone(transaction)
  }

  private required(): IDBDatabase {
    if (!this.database) throw new Error('El almacenamiento binario IndexedDB no está inicializado.')
    return this.database
  }
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
