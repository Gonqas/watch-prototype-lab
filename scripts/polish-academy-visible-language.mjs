import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { polishLearnerFacing } from './academy-editorial/student-copy.mjs'
import { resolveStage05Scope } from './academy-editorial/stage05-scope.mjs'

const checkOnly = process.argv.includes('--check')
const rebuildPackages = new Set(process.argv
  .filter((argument) => argument.startsWith('--rebuild-dist='))
  .flatMap((argument) => argument.slice('--rebuild-dist='.length).split(','))
  .filter(Boolean))
const scope = await resolveStage05Scope()
const changed = []
const changedPackages = new Set()

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true })
  const body = `${JSON.stringify(value, null, 2)}\n`
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await writeFile(path, body, 'utf8')
      return
    } catch (error) {
      if (error?.code !== 'UNKNOWN' || attempt === 7) throw error
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)))
    }
  }
}

for (const pkg of scope.packages) {
  for (const [type, records] of pkg.targets) {
    for (const record of records) {
      if (scope.protectedRecords[type].has(record.value.id)) {
        throw new Error(`La pasada intentó modificar una entidad protegida de etapas 6–7: ${record.value.id}`)
      }
      const polished = polishLearnerFacing(record.value)
      if (JSON.stringify(polished) === JSON.stringify(record.value)) continue
      changed.push(`${pkg.packageName}/${record.entry.path}`)
      changedPackages.add(pkg.packageName)
      record.value = polished
      if (!checkOnly) await writeJson(join(pkg.packageRoot, record.entry.path), polished)
    }
  }
}

if (!checkOnly) {
  for (const pkg of scope.packages.filter(({ packageName }) => changedPackages.has(packageName) || rebuildPackages.has(packageName))) {
    const dist = { manifest: pkg.manifest }
    for (const [collection, entries] of Object.entries(pkg.manifest.entries ?? {})) {
      dist[collection] = await Promise.all(entries.map(async ({ path }) => JSON.parse(await readFile(join(pkg.packageRoot, path), 'utf8'))))
    }
    await writeJson(join(pkg.packageRoot, 'dist', 'pack.json'), dist)
  }
}

console.log(JSON.stringify({
  mode: checkOnly ? 'check' : 'write',
  stages: '0-5',
  protectedStages: '6-7',
  targetLessons: scope.targetLessons.size,
  protectedLessons: scope.protectedLessons.size,
  changedRecords: changed.length,
  changedPackages: [...changedPackages],
  sample: changed.slice(0, 20),
}, null, 2))

if (checkOnly && changed.length) process.exitCode = 1
