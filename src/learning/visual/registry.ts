import { stableFingerprint } from '../identity'
import { TechnicalMovementFixtureSchema, type TechnicalMovementFixture } from '../technical/reconstruction'
import type {
  FixtureLoadRecord,
  RegisteredFixtureLoader,
} from './model'

function loaderKey(fixtureId: string, fixtureVersion: string): string {
  return `${fixtureId}@${fixtureVersion}`
}

export class EducationalFixtureRegistry {
  private readonly loaders = new Map<string, RegisteredFixtureLoader>()
  private readonly cache = new Map<string, TechnicalMovementFixture>()
  private readonly inFlight = new Map<string, Promise<TechnicalMovementFixture>>()
  private readonly references = new Map<string, number>()
  private readonly recordsValue: FixtureLoadRecord[] = []
  private readonly now: () => number
  private readonly wallClock: () => string

  constructor(
    loaders: RegisteredFixtureLoader[] = [],
    now: () => number = () => performance.now(),
    wallClock: () => string = () => new Date().toISOString(),
  ) {
    this.now = now
    this.wallClock = wallClock
    loaders.forEach((loader) => this.register(loader))
  }

  register(loader: RegisteredFixtureLoader): void {
    const key = loaderKey(loader.fixtureId, loader.fixtureVersion)
    if (this.loaders.has(key)) throw new Error(`Loader de fixture duplicado: ${key}`)
    this.loaders.set(key, loader)
  }

  has(fixtureId: string, fixtureVersion: string): boolean {
    return this.loaders.has(loaderKey(fixtureId, fixtureVersion))
  }

  async acquire(fixtureId: string, fixtureVersion: string): Promise<TechnicalMovementFixture> {
    const key = loaderKey(fixtureId, fixtureVersion)
    const cached = this.cache.get(key)
    if (cached) {
      this.references.set(key, (this.references.get(key) ?? 0) + 1)
      this.recordsValue.push({
        fixtureId,
        fixtureVersion,
        durationMs: 0,
        loadedAt: this.wallClock(),
        fromCache: true,
      })
      return structuredClone(cached)
    }
    const pending = this.inFlight.get(key)
    if (pending) {
      const fixture = await pending
      this.references.set(key, (this.references.get(key) ?? 0) + 1)
      this.recordsValue.push({
        fixtureId,
        fixtureVersion,
        durationMs: 0,
        loadedAt: this.wallClock(),
        fromCache: true,
      })
      return structuredClone(fixture)
    }
    const loader = this.loaders.get(key)
    if (!loader) throw new Error(`Fixture visual no registrado: ${key}`)
    const started = this.now()
    const loading = (async () => {
      const fixture = TechnicalMovementFixtureSchema.parse(await loader.load())
      if (fixture.id !== fixtureId || fixture.version !== fixtureVersion) {
        throw new Error(`El loader ${key} devolvió ${fixture.id}@${fixture.version}.`)
      }
      this.cache.set(key, structuredClone(fixture))
      return fixture
    })()
    this.inFlight.set(key, loading)
    try {
      const fixture = await loading
      const durationMs = Math.max(0, this.now() - started)
      this.references.set(key, (this.references.get(key) ?? 0) + 1)
      this.recordsValue.push({
        fixtureId,
        fixtureVersion,
        durationMs,
        loadedAt: this.wallClock(),
        fromCache: false,
      })
      return structuredClone(fixture)
    } finally {
      if (this.inFlight.get(key) === loading) this.inFlight.delete(key)
    }
  }

  release(fixtureId: string, fixtureVersion: string, evictWhenUnused = false): void {
    const key = loaderKey(fixtureId, fixtureVersion)
    const next = Math.max(0, (this.references.get(key) ?? 0) - 1)
    if (next === 0) {
      this.references.delete(key)
      if (evictWhenUnused) this.cache.delete(key)
    } else {
      this.references.set(key, next)
    }
  }

  evict(fixtureId: string, fixtureVersion: string): boolean {
    const key = loaderKey(fixtureId, fixtureVersion)
    if ((this.references.get(key) ?? 0) > 0) return false
    return this.cache.delete(key)
  }

  clearUnused(): void {
    for (const key of this.cache.keys()) {
      if ((this.references.get(key) ?? 0) === 0) this.cache.delete(key)
    }
  }

  records(): FixtureLoadRecord[] {
    return structuredClone(this.recordsValue)
  }

  cacheFingerprint(): string {
    return stableFingerprint([...this.cache.entries()]
      .map(([key, fixture]) => [key, stableFingerprint(fixture)] as const)
      .sort(([left], [right]) => left.localeCompare(right)))
  }
}

const SISTEMA_4B_FIXTURES = [
  'fixture.conceptual.quartz-chain',
  'fixture.miyota.2035.structural',
  'fixture.conceptual.mechanical-chain',
  'fixture.miyota.8215.structural',
] as const

export function createSistema4BFixtureRegistry(
  now?: () => number,
  wallClock?: () => string,
): EducationalFixtureRegistry {
  const loaders = SISTEMA_4B_FIXTURES.map((fixtureId): RegisteredFixtureLoader => ({
    fixtureId,
    fixtureVersion: '0.1.0',
    load: async () => {
      const module = await import('../technical/fixtures')
      return module.technicalFixture(fixtureId)
    },
  }))
  return new EducationalFixtureRegistry(loaders, now, wallClock)
}

export function inMemoryFixtureLoader(
  fixture: TechnicalMovementFixture,
  onLoad: () => void = () => undefined,
): RegisteredFixtureLoader {
  return {
    fixtureId: fixture.id,
    fixtureVersion: fixture.version,
    load: async () => {
      onLoad()
      return structuredClone(fixture)
    },
  }
}
