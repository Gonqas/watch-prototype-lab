import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const roots = [
  'horology-foundations',
  'mechanical-foundations',
  'quartz-miyota2035',
  'miyota8215',
].map((name) => join(process.cwd(), 'learning-content', name, 'blocks'))

const marker = '\n\n## Modelo mental paso a paso\n\n'
let cleaned = 0

for (const root of roots) {
  for (const name of await readdir(root)) {
    if (!name.startsWith('block.') || !name.endsWith('.json')) continue
    const path = join(root, name)
    const block = JSON.parse(await readFile(path, 'utf8'))
    if (typeof block.bodyMarkdown !== 'string' || !block.bodyMarkdown.includes(marker)) continue
    const [specific] = block.bodyMarkdown.split(marker)
    block.bodyMarkdown = specific.trim()
    await writeFile(path, `${JSON.stringify(block, null, 2)}\n`, 'utf8')
    cleaned += 1
  }
}

if (cleaned !== 43) {
  throw new Error(`Se esperaban 43 colas editoriales repetidas y se limpiaron ${cleaned}.`)
}

console.log(`Limpieza editorial completada: ${cleaned} bloques conservan solo su teoría específica.`)
