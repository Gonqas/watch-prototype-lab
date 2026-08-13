import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

const repository = realpathSync(resolve(import.meta.dirname, '..'))
const releaseInstaller = join(repository, 'release', 'WatchPrototypeLab-Instalador-Windows-x64-v0.7.0.exe')
const cadSidecar = join(repository, 'src-tauri', 'binaries', 'watchlab-cad-x86_64-pc-windows-msvc.exe')
const expectedReleaseHash = '8d50904050237d3a38c0bb28393e3c6b0f1886624856ae5210dc045a55aac9ca'
const expectedSidecarHash = '3417670ade1644c39f47b598f0a3ad0ce7327d6fde19f202c5ad01c5434654e1'
const exactTargets = [
  'dist',
  'tmp',
  'build',
  'cad-engine/build',
  'cad-engine/.pytest_cache',
  'cad-engine/dist',
  'src-tauri/target',
]

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function assertProtectedArtifacts() {
  if (!existsSync(releaseInstaller) || sha256(releaseInstaller) !== expectedReleaseHash) {
    throw new Error('El instalador 0.7.0 no coincide con el artefacto protegido.')
  }
  if (!existsSync(cadSidecar) || sha256(cadSidecar) !== expectedSidecarHash) {
    throw new Error('El sidecar CAD no coincide con el artefacto protegido.')
  }
}

function assertInsideRepository(filePath) {
  const normalizedRepository = repository.toLowerCase()
  const normalizedPath = filePath.toLowerCase()
  if (normalizedPath === normalizedRepository || !normalizedPath.startsWith(`${normalizedRepository}${sep}`)) {
    throw new Error(`Ruta fuera del repositorio o demasiado amplia: ${filePath}`)
  }
}

function summarize(filePath) {
  const stat = lstatSync(filePath)
  if (!stat.isDirectory()) return { files: 1, bytes: stat.size }
  let files = 0
  let bytes = 0
  const stack = [filePath]
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const child = join(current, entry.name)
      if (entry.isDirectory()) stack.push(child)
      else if (entry.isFile()) {
        const childStat = lstatSync(child)
        files += 1
        bytes += childStat.size
      } else {
        throw new Error(`Entrada no regular; requiere revisión humana: ${child}`)
      }
    }
  }
  return { files, bytes }
}

assertProtectedArtifacts()
const records = []
for (const relativeTarget of exactTargets) {
  const candidate = join(repository, relativeTarget)
  if (!existsSync(candidate)) continue
  const resolved = realpathSync(candidate)
  assertInsideRepository(resolved)
  const summary = summarize(resolved)
  rmSync(resolved, { recursive: true, force: false, maxRetries: 2, retryDelay: 100 })
  records.push({ path: resolved, relativePath: relativeTarget, ...summary, result: 'removed' })
}

for (const entry of readdirSync(repository, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.log')) continue
  const candidate = realpathSync(join(repository, entry.name))
  assertInsideRepository(candidate)
  const summary = summarize(candidate)
  rmSync(candidate, { force: false })
  records.push({ path: candidate, relativePath: entry.name, ...summary, result: 'removed' })
}

assertProtectedArtifacts()
console.log(JSON.stringify({
  schemaVersion: 1,
  executedAt: new Date().toISOString(),
  repository,
  records,
  totals: {
    entries: records.length,
    files: records.reduce((total, record) => total + record.files, 0),
    bytes: records.reduce((total, record) => total + record.bytes, 0),
  },
  protectedArtifacts: {
    releaseInstaller: { path: releaseInstaller, sha256: sha256(releaseInstaller) },
    cadSidecar: { path: cadSidecar, sha256: sha256(cadSidecar) },
  },
}, null, 2))
