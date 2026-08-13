const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/

export interface ParsedSemVer {
  major: number
  minor: number
  patch: number
  prerelease: string[]
}

export function parseSemVer(value: string): ParsedSemVer | null {
  const match = SEMVER_PATTERN.exec(value)
  if (!match) return null
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? [],
  }
}

export function compareSemVer(left: string, right: string): number {
  const a = parseSemVer(left)
  const b = parseSemVer(right)
  if (!a || !b) throw new Error(`SemVer inválido: ${!a ? left : right}`)
  for (const key of ['major', 'minor', 'patch'] as const) if (a[key] !== b[key]) return a[key] - b[key]
  if (a.prerelease.length === 0 || b.prerelease.length === 0) return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length === 0 ? 1 : -1
  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const av = a.prerelease[index]
    const bv = b.prerelease[index]
    if (av === undefined || bv === undefined) return av === bv ? 0 : av === undefined ? -1 : 1
    if (av === bv) continue
    const an = /^\d+$/.test(av) ? Number(av) : null
    const bn = /^\d+$/.test(bv) ? Number(bv) : null
    if (an !== null && bn !== null) return an - bn
    if (an !== null || bn !== null) return an !== null ? -1 : 1
    return av.localeCompare(bv)
  }
  return 0
}

function comparator(version: string, token: string): boolean {
  const match = /^(>=|<=|>|<|=)?(.+)$/.exec(token)
  if (!match || !parseSemVer(match[2])) return false
  const compared = compareSemVer(version, match[2])
  if (match[1] === '>=') return compared >= 0
  if (match[1] === '<=') return compared <= 0
  if (match[1] === '>') return compared > 0
  if (match[1] === '<') return compared < 0
  return compared === 0
}

export function satisfiesSemVerRange(version: string, range: string): boolean {
  const parsed = parseSemVer(version)
  if (!parsed) return false
  const normalized = range.trim()
  if (normalized === '' || normalized === '*') return true
  return normalized.split('||').some((alternative) => {
    const value = alternative.trim()
    if (value.startsWith('^') || value.startsWith('~')) {
      const baseText = value.slice(1)
      const base = parseSemVer(baseText)
      if (!base || compareSemVer(version, baseText) < 0) return false
      const upper = value.startsWith('^')
        ? base.major > 0 ? `${base.major + 1}.0.0` : base.minor > 0 ? `0.${base.minor + 1}.0` : `0.0.${base.patch + 1}`
        : `${base.major}.${base.minor + 1}.0`
      return compareSemVer(version, upper) < 0
    }
    const tokens = value.split(/\s+/)
    return tokens.every((token) => comparator(version, token))
  })
}
