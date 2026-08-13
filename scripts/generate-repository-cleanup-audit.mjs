import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outputDirectory = join(root, 'docs', 'cleanup')
mkdirSync(outputDirectory, { recursive: true })

const normalize = (value) => value.replaceAll('\\', '/')
const sha256 = (filePath) => createHash('sha256').update(readFileSync(filePath)).digest('hex')
const sourcePaths = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
  cwd: root,
  encoding: 'utf8',
}).split(/\r?\n/u).filter(Boolean).map(normalize).sort()

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.ps1', '.py', '.rs', '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml'])
const binaryExtensions = new Set(['.bin', '.bmp', '.dll', '.exe', '.gif', '.ico', '.jpeg', '.jpg', '.msi', '.png', '.svg', '.webp'])
const codePaths = sourcePaths.filter((filePath) => /^(src|scripts|src-tauri|cad-engine)\//u.test(filePath) && textExtensions.has(extname(filePath).toLowerCase()))
const codeCorpus = codePaths.map((filePath) => readFileSync(join(root, filePath), 'utf8')).join('\n')

function classifySource(filePath) {
  const extension = extname(filePath).toLowerCase()
  const test = /(?:^|\/)(?:tests?|__tests__)(?:\/|$)|\.(?:spec|test)\.[^.]+$/u.test(filePath)
  const content = filePath.startsWith('learning-content/')
  const generated = filePath === 'src/learning/content/schemas/learning-pack-v1.validator.js'
  const data = content || ['.json', '.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(extension)
  const basename = filePath.split('/').at(-1) ?? filePath
  const referenced = codeCorpus.includes(filePath) || codeCorpus.includes(filePath.replaceAll('/', '\\')) || codeCorpus.includes(basename)
  const classification = generated
    ? 'generated-current'
    : content
      ? 'content-source'
      : test
        ? 'test-required'
        : 'production-required'
  return {
    origin: content ? 'integrated-learning-content' : generated ? 'schema-generator' : 'repository-source',
    imported: referenced,
    referenced,
    packed: content || filePath.startsWith('public/') || filePath.startsWith('src/'),
    tests: test,
    data,
    regenerable: generated,
    classification,
    decision: generated ? 'regenerate-during-verify' : 'keep',
  }
}

function directorySummary(relativePath) {
  const absolutePath = join(root, relativePath)
  if (!statSafe(absolutePath)?.isDirectory()) return null
  let bytes = 0
  let files = 0
  let newest = 0
  const stack = [absolutePath]
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name)
      if (entry.isDirectory()) stack.push(entryPath)
      else if (entry.isFile()) {
        const stat = statSync(entryPath)
        bytes += stat.size
        files += 1
        newest = Math.max(newest, stat.mtimeMs)
      }
    }
  }
  return { bytes, files, newest: newest ? new Date(newest).toISOString() : null }
}

function statSafe(filePath) {
  try { return statSync(filePath) } catch { return null }
}

const inventory = sourcePaths.map((filePath) => {
  const absolutePath = join(root, filePath)
  const stat = statSync(absolutePath)
  const classification = classifySource(filePath)
  return {
    path: filePath,
    type: extname(filePath).slice(1).toLowerCase() || 'file',
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    sha256: sha256(absolutePath),
    ...classification,
  }
})

const generatedAreas = [
  ['node_modules', 'development-required', 'keep', 'npm ci'],
  ['.venv-cad', 'development-required', 'keep', 'python environment bootstrap'],
  ['release', 'generated-current', 'keep-stable-installers', 'npm run installer'],
  ['src-tauri/binaries', 'generated-current', 'keep-bundled-sidecar', 'npm run cad:package plus installer script'],
  ['dist', 'generated-stale', 'safe-to-remove', 'npm run build'],
  ['build', 'generated-stale', 'safe-to-remove', 'npm run installer'],
  ['tmp', 'generated-stale', 'safe-to-remove', 'test and audit scripts'],
  ['cad-engine/build', 'generated-stale', 'safe-to-remove', 'npm run cad:package'],
  ['cad-engine/dist', 'generated-stale', 'safe-to-remove-after-sidecar-check', 'npm run cad:package'],
  ['cad-engine/.pytest_cache', 'generated-stale', 'safe-to-remove', 'npm run cad:test'],
  ['src-tauri/target', 'generated-stale', 'safe-to-remove-after-release-check', 'cargo test or npm run installer'],
].map(([path, classification, decision, regeneration]) => ({
  path,
  type: 'directory-summary',
  ...directorySummary(path),
  origin: 'generated-or-local-tooling',
  imported: path === 'src-tauri/binaries' || path === 'cad-engine/dist',
  referenced: path === 'src-tauri/binaries' || path === 'cad-engine/dist' || path === 'release',
  packed: path === 'src-tauri/binaries',
  tests: false,
  data: false,
  regenerable: !['node_modules', '.venv-cad', 'release', 'src-tauri/binaries'].includes(path),
  classification,
  decision,
  regeneration,
})).filter((record) => record.files !== undefined)

const logFiles = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.log'))
  .map((entry) => {
    const filePath = join(root, entry.name)
    const stat = statSync(filePath)
    return {
      path: entry.name,
      type: 'log',
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      sha256: sha256(filePath),
      origin: 'local-development-runtime',
      imported: false,
      referenced: false,
      packed: false,
      tests: false,
      data: false,
      regenerable: true,
      classification: 'generated-stale',
      decision: 'safe-to-remove',
      regeneration: 'vite or installer diagnostic run',
    }
  })

const fullInventory = [...inventory, ...generatedAreas, ...logFiles]
const inventoryDocument = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  repository: normalize(root),
  protectionCheckpoint: {
    path: '<external-checkpoints>/WatchPrototypeLab-0.7.0-pre5A-20260802-112047.zip',
    bytes: 49_684_715,
    sha256: '48bc27f6ce34d491c9c0dcc34e7c14470df60c9278129063abeb8c98a9b917e3',
    entries: 1_436,
  },
  records: fullInventory,
}
writeFileSync(join(outputDirectory, 'FILE-INVENTORY.json'), `${JSON.stringify(inventoryDocument, null, 2)}\n`)

const counts = new Map()
for (const record of fullInventory) counts.set(record.classification, (counts.get(record.classification) ?? 0) + 1)
const largestSource = inventory.toSorted((a, b) => b.size - a.size).slice(0, 30)
const generatedRows = generatedAreas.toSorted((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))
const inventoryMarkdown = `# Inventario técnico del repositorio\n\nGenerado: ${inventoryDocument.generatedAt}\n\nEste informe cubre individualmente los ${inventory.length.toLocaleString('es-ES')} archivos fuente no ignorados y agrega por directorio los entornos y salidas generadas. El detalle reproducible, con SHA-256 por archivo fuente, está en \`FILE-INVENTORY.json\`. Los datos privados ignorados no se abren ni se incluyen.\n\n## Punto de restauración\n\n- Ruta externa: \`${inventoryDocument.protectionCheckpoint.path}\`\n- Entradas: ${inventoryDocument.protectionCheckpoint.entries}\n- Tamaño: ${inventoryDocument.protectionCheckpoint.bytes.toLocaleString('es-ES')} bytes\n- SHA-256: \`${inventoryDocument.protectionCheckpoint.sha256}\`\n\n## Clasificación\n\n| Clasificación | Registros |\n|---|---:|\n${[...counts].sort(([left], [right]) => left.localeCompare(right)).map(([name, count]) => `| ${name} | ${count} |`).join('\n')}\n\n## Áreas generadas o locales\n\n| Ruta | Archivos | Bytes | Decisión | Regeneración |\n|---|---:|---:|---|---|\n${generatedRows.map((record) => `| \`${record.path}\` | ${record.files} | ${(record.bytes ?? 0).toLocaleString('es-ES')} | ${record.decision} | ${record.regeneration} |`).join('\n')}\n\n## Mayores archivos fuente\n\n| Ruta | Bytes | Clasificación | Referenciado |\n|---|---:|---|---|\n${largestSource.map((record) => `| \`${record.path}\` | ${record.size.toLocaleString('es-ES')} | ${record.classification} | ${record.referenced ? 'sí' : 'no detectado'} |`).join('\n')}\n\n## Criterio de decisión\n\n- \`keep\`: fuente, prueba, documentación o contenido declarativo integrado.\n- \`keep-stable-installers\`: entregables previos, conservados aunque exista una copia en \`target\`.\n- \`keep-bundled-sidecar\`: binario que Tauri empaqueta; no se elimina sin regeneración y prueba Desktop.\n- \`safe-to-remove\`: salida ignorada, sin datos de usuario y con comando de regeneración documentado.\n- \`safe-to-remove-after-*\`: requiere comprobar primero la copia conservada indicada.\n- Lo desconocido no se elimina.\n`
writeFileSync(join(outputDirectory, 'FILE-INVENTORY.md'), inventoryMarkdown)

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const dependencyRows = Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies }).map(([name, version]) => {
  const token = name.startsWith('@') ? name : `'${name}'`
  const occurrences = codeCorpus.split(token).length - 1
  return { name, version, occurrences, decision: occurrences > 0 ? 'required' : 'review-transitive-or-cli' }
})
const dependencyMarkdown = `# Auditoría de dependencias\n\n## Dependencias JavaScript\n\n| Paquete | Versión declarada | Referencias directas detectadas | Decisión |\n|---|---|---:|---|\n${dependencyRows.map((record) => `| \`${record.name}\` | \`${record.version}\` | ${record.occurrences} | ${record.decision} |`).join('\n')}\n\n## Rust, Tauri y sidecar\n\n- \`src-tauri/Cargo.lock\` fija la resolución Rust y se conserva.\n- \`tauri-plugin-dialog\`, \`tauri-plugin-fs\` y \`tauri-plugin-opener\` están registrados y tienen consumidores directos.\n- \`src-tauri/binaries/watchlab-cad-*.exe\` es el sidecar empaquetado; se conserva antes de limpiar PyInstaller.\n- \`cad-engine/dist\` y \`cad-engine/build\` son salidas de \`npm run cad:package\`, no fuente canónica.\n\n## Grafo y empaquetado\n\n- Entrada Web: \`src/main.tsx → src/App.tsx\`.\n- Academia: carga diferida desde \`App.tsx\`, con superficies internas también divididas.\n- Persistencia: repositorios Web/IndexedDB y adaptador SQLite nativo existentes; 5A debe ampliarlos, no crear un tercer subsistema.\n- Desktop: Tauri registra comandos de proyecto, aprendizaje y CAD en \`src-tauri/src/lib.rs\`.\n- Build inicial válido, con dos incidencias a corregir: import dinámico ineficaz de \`@tauri-apps/api/core\` y chunks superiores a 500 kB.\n\n## Decisión\n\nNo se elimina ninguna dependencia en esta fase: las referencias cero incluyen herramientas de build/CLI y requieren análisis semántico adicional. Se optimizará el grafo mediante división de contenido y fronteras lazy explícitas, sin alterar el lockfile por limpieza cosmética.\n`
writeFileSync(join(outputDirectory, 'DEPENDENCY-AUDIT.md'), dependencyMarkdown)
appendFileSync(join(outputDirectory, 'DEPENDENCY-AUDIT.md'), '\n## Estado final 0.8\n\nEl import dinámico ineficaz de Tauri quedó corregido y Metrología/contenido se cargan mediante fronteras diferidas. Persisten avisos no bloqueantes por chunks históricos de contenido mayores de 500 kB; no se oculta el umbral ni se alteran datos editoriales para reducirlo artificialmente.\n')

const binaryFiles = inventory.filter((record) => binaryExtensions.has(`.${record.type}`)).toSorted((a, b) => b.size - a.size)
const duplicateGroups = new Map()
for (const record of inventory) {
  const group = duplicateGroups.get(record.sha256) ?? []
  group.push(record)
  duplicateGroups.set(record.sha256, group)
}
const duplicates = [...duplicateGroups.values()].filter((group) => group.length > 1)
const binaryMarkdown = `# Auditoría binaria\n\n## Binarios fuente o recursos empaquetados\n\n| Ruta | Bytes | SHA-256 | Decisión |\n|---|---:|---|---|\n${binaryFiles.map((record) => `| \`${record.path}\` | ${record.size.toLocaleString('es-ES')} | \`${record.sha256}\` | ${record.decision} |`).join('\n') || '| — | 0 | — | — |'}\n\n## Duplicados exactos dentro del estado fuente\n\n${duplicates.length === 0 ? 'No se detectaron duplicados exactos.' : duplicates.map((group) => `- \`${group[0].sha256}\`: ${group.map((record) => `\`${record.path}\``).join(', ')}`).join('\n')}\n\n## Salidas grandes\n\n- Los instaladores de \`release/\` son entregables estables y no se borran.\n- Sus copias exactas bajo \`src-tauri/target/release/bundle\` son regenerables y quedan cubiertas por el plan de limpieza.\n- \`src-tauri/binaries\` conserva el sidecar que Tauri empaqueta.\n- No se ha ejecutado ningún binario desconocido ni se han abierto documentos privados.\n`
writeFileSync(join(outputDirectory, 'BINARY-AUDIT.md'), binaryMarkdown)

const manifests = sourcePaths.filter((filePath) => filePath.startsWith('learning-content/') && filePath.endsWith('manifest.json'))
const contentRows = manifests.map((manifestPath) => {
  const manifest = JSON.parse(readFileSync(join(root, manifestPath), 'utf8'))
  const area = manifestPath.split('/').slice(0, 2).join('/')
  const summary = directorySummary(area)
  return { path: manifestPath, id: manifest.id, version: manifest.packageVersion, status: manifest.editorialStatus ?? 'sin declarar', bytes: summary?.bytes ?? 0, files: summary?.files ?? 0 }
})
const contentMarkdown = `# Auditoría de contenido\n\n| Paquete | ID | Versión | Estado | Archivos | Bytes |\n|---|---|---|---|---:|---:|\n${contentRows.map((record) => `| \`${record.path}\` | \`${record.id}\` | ${record.version} | ${record.status} | ${record.files} | ${record.bytes.toLocaleString('es-ES')} |`).join('\n')}\n\n## Decisiones\n\n- Los paquetes actuales son fuente editorial integrada y se conservan.\n- No se rebajan sus versiones durante 5A.\n- El nuevo paquete de inspección y metrología tendrá ID propio y carga diferida; no se mezclará con los paquetes MIYOTA.\n- Los libros privados, PDFs y ZIP originales están ignorados y fuera de este inventario; no se copian ni se abren durante la limpieza.\n- Las salidas \`dist-*\`, previews e informes reproducibles se distinguen de la fuente declarativa.\n`
writeFileSync(join(outputDirectory, 'CONTENT-AUDIT.md'), contentMarkdown)
appendFileSync(join(outputDirectory, 'CONTENT-AUDIT.md'), '\n## Estado final 0.8\n\n`wplab.horology.inspection-metrology@0.1.0` quedó integrado con carga diferida y separado de los paquetes MIYOTA. Sus 14 módulos, 28 actividades y artefactos de informe forman parte de la fuente editorial conservada.\n')

const deletionPlan = `# Plan de eliminación segura\n\nNo se elimina ningún elemento desconocido. El orden protege primero los entregables y después retira solo cachés/salidas regenerables.\n\n| Orden | Ruta | Motivo | Prueba | Regeneración | Riesgo | Validación posterior |\n|---:|---|---|---|---|---|---|\n| 1 | logs raíz \`*.log\` | Diagnóstico local obsoleto | ignorados, sin referencias | nueva ejecución Vite/installer | bajo | \`npm run verify\` |\n| 2 | \`dist/\` | build Web reproducible | baseline acaba de regenerarlo | \`npm run build\` | bajo | build y tamaños de chunks |\n| 3 | \`tmp/\` | fixtures/reportes temporales | ignorado, sin datos de usuario detectados | scripts de prueba/auditoría | bajo | pruebas de contenido |\n| 4 | \`build/\` | salida de instalador antigua | instaladores estables están en \`release/\` | \`npm run installer\` | bajo | conservar hashes de release |\n| 5 | \`cad-engine/build/\`, \`.pytest_cache\` | caché PyInstaller/pytest | fuente está en \`cad-engine/watchlab_cad\` | \`npm run cad:package\`, \`npm run cad:test\` | bajo | pruebas CAD |\n| 6 | \`cad-engine/dist/\` | paquete PyInstaller duplicado | sidecar conservado en \`src-tauri/binaries\` | \`npm run cad:package\` | medio | hash/presencia sidecar y build Desktop |\n| 7 | \`src-tauri/target/\` | salida Cargo de 15+ GB | instaladores estables conservados en \`release/\` | \`cargo test\`, \`npm run installer\` | medio | pruebas Rust + installer 0.8 |\n\n## Exclusiones expresas\n\nNo se tocan \`.git/\`, \`release/\`, \`src-tauri/binaries/\`, \`node_modules/\`, \`.venv-cad/\`, bases SQLite, perfiles, sesiones, \`.wplab\`, fotos, mediciones, checkpoints externos, secretos, documentos privados ni originales.\n`
if (!existsSync(join(outputDirectory, 'DELETION-PLAN.md'))) writeFileSync(join(outputDirectory, 'DELETION-PLAN.md'), deletionPlan)

const deletionManifest = `# Manifiesto de eliminación\n\nEstado: **pendiente de ejecución**.\n\nNo se había eliminado ningún archivo al generar este documento. Cada eliminación se añadirá con ruta absoluta resuelta, tamaño, motivo, prueba, regeneración, riesgo y resultado de validación.\n`
if (!existsSync(join(outputDirectory, 'DELETION-MANIFEST.md'))) writeFileSync(join(outputDirectory, 'DELETION-MANIFEST.md'), deletionManifest)

console.log(JSON.stringify({ sourceFiles: inventory.length, generatedAreas: generatedAreas.length, logFiles: logFiles.length, manifests: manifests.length }, null, 2))
