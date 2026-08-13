import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const files = [
  'src/learning/ui/learning.css',
  'src/learning/ui/academy.css',
  'src/learning/ui/academy-surfaces.css',
]

for (const relativePath of files) {
  const path = join(root, relativePath)
  const source = readFileSync(path, 'utf8')
  const normalized = source.replace(
    /font-size:\s*([0-9.]+)(px|rem);/g,
    (_match, value, unit) => `font-size: calc(${value}${unit} * var(--learning-text-scale));`,
  )
  if (normalized.includes('font-size: calc( *')) {
    throw new Error(`${relativePath} contiene una regla de escala incompleta.`)
  }
  if (normalized !== source) writeFileSync(path, normalized, 'utf8')
  console.log(`${relativePath}: ${normalized === source ? 'ya normalizado' : 'normalizado'}`)
}

