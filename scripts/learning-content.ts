import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LearningPackManifestSchema, sha256Hex, type LearningPack } from '../src/learning/content/learningPack'
import {
  validateAuthoringPack,
  visualNeedsAsMarkdown,
  type AuthoringDiagnostic,
} from '../src/learning/content/authoringValidation'
import { encodeLearningPackage } from '../src/learning/runtime/packageEncoder'
import { SceneCompiler } from '../src/learning/runtime/compiler'
import type { LoadedLearningPackage } from '../src/learning/runtime/packageLoader'
import { CapabilityResolver, HEADLESS_RUNTIME_CAPABILITIES } from '../src/learning/runtime/capabilities'
import { memoryBridgeCapabilities } from '../src/learning/runtime/bridge'
import { ProjectEntityIndex } from '../src/learning/canonical'
import { projectV5ToCanonical } from '../src/learning/adapters/projectV5'
import { createV5ProjectFixture } from '../src/learning/fixtures/canonicalFixtures'
import { sceneFixtureIndex } from '../src/learning/visual/sceneFixtures'

type AuthoringCommand = 'validate' | 'lint' | 'preview' | 'pack' | 'visual-report'

const COLLECTION_NAMES = [
  'curricula',
  'routes',
  'modules',
  'concepts',
  'misconceptions',
  'blocks',
  'lessons',
  'activities',
  'scenes',
  'competencies',
  'evidenceTemplates',
  'rubrics',
  'glossary',
  'sources',
  'recommendations',
  'visualResources',
] as const

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown
  } catch (error) {
    throw new Error(`${path} no contiene JSON válido: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
}

export async function materializeAuthoringWorkspace(root: string): Promise<{
  input: unknown
  assetBytes: Array<{ assetId: string; bytes: Uint8Array }>
}> {
  const manifestInput = await readJson(resolve(root, 'manifest.json'))
  const manifest = LearningPackManifestSchema.parse(manifestInput)
  const collections = Object.fromEntries(await Promise.all(COLLECTION_NAMES.map(async (name) => [
    name,
    await Promise.all(manifest.entries[name].map(({ path }) => readJson(resolve(root, path)))),
  ]))) as Record<(typeof COLLECTION_NAMES)[number], unknown[]>
  const assetBytes = await Promise.all(manifest.assets.map(async (asset) => {
    const bytes = new Uint8Array(await readFile(resolve(root, asset.path)))
    const hash = await sha256Hex(bytes)
    if (bytes.byteLength !== asset.bytes) throw new Error(`El activo ${asset.id} declara ${asset.bytes} bytes y contiene ${bytes.byteLength}.`)
    if (hash !== asset.sha256) throw new Error(`El activo ${asset.id} no coincide con su SHA-256 declarado.`)
    return { assetId: asset.id, bytes }
  }))
  return {
    input: { manifest: manifestInput, ...collections },
    assetBytes,
  }
}

function formatDiagnostic(issue: AuthoringDiagnostic): string {
  return `${issue.severity.toUpperCase()} ${issue.code} ${issue.path || '/'} — ${issue.message}\n  → ${issue.recovery}`
}

function printDiagnostics(diagnostics: AuthoringDiagnostic[]): void {
  if (diagnostics.length === 0) {
    console.log('Sin diagnósticos editoriales.')
    return
  }
  diagnostics.forEach((issue) => console.log(formatDiagnostic(issue)))
}

function compileScenes(pack: LearningPack): AuthoringDiagnostic[] {
  const compiler = new SceneCompiler()
  const capabilities = new CapabilityResolver([...HEADLESS_RUNTIME_CAPABILITIES, ...memoryBridgeCapabilities()])
  const fallbackIndex = () => new ProjectEntityIndex(projectV5ToCanonical(createV5ProjectFixture()))
  const loaded: LoadedLearningPackage = {
    pack,
    origin: pack.manifest.distribution,
    packageFingerprint: `authoring:${pack.manifest.id}@${pack.manifest.packageVersion}`,
    assets: new Map<string, Uint8Array>(),
    diagnostics: [],
    zip: { entries: [], totalCompressedBytes: 0, totalUncompressedBytes: 0 },
  }
  return pack.scenes.flatMap((scene) => {
    const index = sceneFixtureIndex(scene.fixtureBinding, fallbackIndex)
    const result = compiler.compile(loaded, scene.id, index, capabilities, { reducedMotion: false })
    return result.diagnostics.map((issue) => ({
      code: `AUTHORING-SCENE-${issue.code}`,
      severity: issue.blocking ? 'error' as const : 'warning' as const,
      path: scene.id,
      message: issue.message,
      recovery: issue.suggestedRecovery ?? 'Corrige la escena o sus selectores.',
    }))
  })
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function previewHtml(pack: LearningPack, diagnostics: AuthoringDiagnostic[]): string {
  const list = (values: string[]) => values.length
    ? `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`
    : '<p>—</p>'
  const routes = pack.routes.map((route) => {
    const modules = route.moduleIds.map((moduleId) => {
      const module = pack.modules.find(({ id }) => id === moduleId)
      const lessons = module?.lessonIds.map((lessonId) => {
        const lesson = pack.lessons.find(({ id }) => id === lessonId)
        const activities = lesson?.activityIds.map((activityId) =>
          pack.activities.find(({ id }) => id === activityId)?.authoring?.title.es ?? activityId) ?? []
        return `<li><strong>${escapeHtml(lesson?.authoring?.title.es ?? lessonId)}</strong><ul>${activities.map((title) => `<li>${escapeHtml(title)}</li>`).join('')}</ul></li>`
      }).join('') ?? ''
      return `<li><strong>${escapeHtml(module?.title.es ?? moduleId)}</strong><ul>${lessons}</ul></li>`
    }).join('')
    return `<section><h2>${escapeHtml(route.title.es)}</h2><p>${escapeHtml(route.purpose.es)}</p><ul>${modules}</ul></section>`
  }).join('')
  const issues = diagnostics.map((issue) =>
    `<li class="${issue.severity}"><strong>${escapeHtml(issue.code)}</strong> · ${escapeHtml(issue.path)} — ${escapeHtml(issue.message)}</li>`).join('')
  const resources = pack.visualResources.map((resource) =>
    `<tr><td>${escapeHtml(resource.id)}</td><td>${escapeHtml(resource.type)}</td><td>${resource.status}</td><td>${resource.priority}</td><td>${resource.fidelity.geometry}/${resource.fidelity.kinematics}/${resource.fidelity.physics}</td><td>${resource.currentModelSupport}</td><td>${escapeHtml(resource.partSelectors.map(({ cardinality }) => JSON.stringify(cardinality)).join(', ') || '—')}</td></tr>`).join('')
  const lessons = pack.lessons.map((lesson) => {
    const blocks = lesson.blockIds.map((id) => pack.blocks.find((block) => block.id === id)).filter((value) => value !== undefined)
    const claims = blocks.flatMap((block) => block.claims)
    return `<details><summary><strong>${escapeHtml(lesson.title)}</strong> · ${claims.length} claims · ${lesson.activityIds.length} actividades</summary>
      ${blocks.map((block) => `<article><h3>${escapeHtml(block.title)}</h3><pre>${escapeHtml(block.bodyMarkdown)}</pre></article>`).join('')}
      <h3>Claims</h3>${list(claims.map((claim) => `${claim.id} · ${claim.claimType}/${claim.classification} · ${claim.fidelity.geometry}/${claim.fidelity.kinematics}/${claim.fidelity.physics} · ${claim.sources.map(({ id }) => id).join(', ') || 'sin fuente'}`))}
      <h3>Fuentes y recursos</h3>${list([...(lesson.authoring?.sourceIds ?? []), ...(lesson.authoring?.visualResourceIds ?? [])])}
    </details>`
  }).join('')
  const scenes = pack.scenes.map((scene) => `<details><summary><strong>${escapeHtml(scene.title)}</strong> · ${scene.steps.length} pasos · ${scene.timeline.length} operaciones</summary>
    <p>${escapeHtml(scene.description ?? 'Sin descripción')}</p>
    <p><strong>Fixture:</strong> ${escapeHtml(JSON.stringify(scene.fixtureBinding ?? {}))}</p>
    <p><strong>Operaciones:</strong> ${escapeHtml(scene.timeline.map(({ operation }) => operation).join(', ') || '—')}</p>
    <p><strong>Overlays:</strong> ${escapeHtml(scene.overlays.map(({ kind, id }) => `${kind}:${id}`).join(', ') || '—')}</p>
    <p><strong>Storyboard:</strong> ${escapeHtml(scene.storyboard?.narrative.es ?? '—')}</p>
    <p><strong>Alternativa textual:</strong> ${escapeHtml(scene.accessibility?.textualAlternative ?? scene.storyboard?.accessibility.es ?? scene.description ?? '—')}</p>
    <p><strong>Reduced motion:</strong> ${escapeHtml(scene.accessibility?.reducedMotionAlternative ?? scene.storyboard?.reducedMotion.es ?? '—')}</p>
  </details>`).join('')
  const glossary = pack.glossary.map((term) =>
    `<tr><td>${escapeHtml(term.id)}</td><td>${escapeHtml(term.authoring?.terms.es ?? term.term)}</td><td>${escapeHtml(term.authoring?.terms.en ?? '—')}</td><td>${escapeHtml(term.definitionMarkdown)}</td></tr>`).join('')
  const competencies = pack.competencies.map((competency) => {
    const evidence = pack.evidenceTemplates.filter(({ competencyId }) => competencyId === competency.id)
    const rubrics = pack.rubrics.filter(({ competencyId }) => competencyId === competency.id)
    return `<tr><td>${escapeHtml(competency.id)}</td><td>${escapeHtml(competency.description)}</td><td>${escapeHtml(evidence.map(({ id }) => id).join(', '))}</td><td>${escapeHtml(rubrics.map(({ id, assessmentRule }) => `${id}→${assessmentRule?.targetState ?? 'no-rule'}`).join(', '))}</td></tr>`
  }).join('')
  const sources = pack.sources.map((source) =>
    `<tr><td>${escapeHtml(source.id)}</td><td>${escapeHtml(source.authority)}</td><td>${escapeHtml(source.resource.title)}</td><td>${escapeHtml(source.resource.locator ?? '—')}</td><td>${escapeHtml(source.supportedClaim)}</td></tr>`).join('')
  const warnings = pack.activities.flatMap((activity) =>
    activity.authoring?.warnings.es.map((warning) => `${activity.id}: ${warning}`) ?? [])
  const workbenchRows = pack.activities.flatMap((activity) => {
    const contract = activity.authoring?.workbenchContract
    if (!contract) return []
    return [`<tr><td>${escapeHtml(activity.id)}</td><td>${escapeHtml(contract.fixtureId)}</td><td>${escapeHtml(contract.modes.join(', '))}</td><td>${escapeHtml(contract.requiredZones.join(', '))}</td><td>${escapeHtml(contract.evidenceContext.join(', '))}</td><td>${escapeHtml(activity.evidenceTemplateIds.join(', '))}</td><td>${escapeHtml(activity.rubricId)}</td></tr>`]
  }).join('')
  const mechanicalRows = pack.activities.flatMap((activity) => {
    const contract = activity.authoring?.mechanicalLabContract
    if (!contract) return []
    return [`<tr><td>${escapeHtml(activity.id)}</td><td>${escapeHtml(contract.subsystem)}</td><td>${escapeHtml(contract.commands.join(', '))}</td><td>${escapeHtml(contract.viewModes.join(', '))}</td><td>${contract.normalizedPhysicsOnly ? 'normalizada' : 'no declarada'}</td><td>${contract.reducedMotion ? 'sí' : 'no'}</td><td>${escapeHtml(activity.rubricId)}</td></tr>`]
  }).join('')
  const calibreRows = pack.activities.flatMap((activity) => {
    const contract = activity.authoring?.calibreLabContract
    if (!contract) return []
    return [`<tr><td>${escapeHtml(activity.id)}</td><td>${escapeHtml(contract.fixtureId)}</td><td>${escapeHtml(contract.modes.join(', '))}</td><td>${escapeHtml(contract.subsystemIds.join(', '))}</td><td>${escapeHtml(contract.operationPhases.join(', '))}</td><td>${escapeHtml(contract.contextualMechanicalLabs.join(', ') || '—')}</td><td>${contract.authorityVisible ? 'visible' : 'oculta'}</td><td>${contract.instanceIdentityRequired ? 'obligatoria' : 'no exigida'}</td><td>${contract.reducedMotion ? 'sí' : 'no'}</td></tr>`]
  }).join('')
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Preview · ${escapeHtml(pack.manifest.title)}</title>
<style>body{font:16px/1.55 system-ui;max-width:1200px;margin:auto;padding:2rem;color:#18201c;background:#f5f3ec}header,section,details{background:white;border:1px solid #d8d4c7;padding:1.25rem;margin:1rem 0}code{background:#e9ece7;padding:.15rem .35rem}pre{white-space:pre-wrap;font:14px/1.5 system-ui;background:#f5f3ec;padding:1rem}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8d4c7;padding:.55rem;text-align:left;vertical-align:top}.error{color:#9b1c1c}.warning{color:#855700}.badge{display:inline-block;border:1px solid;padding:.2rem .5rem;margin-right:.5rem}</style>
</head><body><header><p>PREVISUALIZACIÓN DE AUTORÍA</p><h1>${escapeHtml(pack.manifest.title)}</h1><p><code>${pack.manifest.id}@${pack.manifest.packageVersion}</code></p><p>Esta vista no sustituye la ejecución en Watch Prototype Lab.</p></header>
<section><span class="badge">${escapeHtml(pack.manifest.editorialStatus)}</span><span class="badge">${escapeHtml(pack.manifest.distribution)}</span><span class="badge">${escapeHtml(pack.manifest.languages.join(', '))}</span><h2>Jerarquía</h2>${routes}</section>
<section><h2>Lecciones, texto y claims</h2>${lessons}</section>
<section><h2>Escenas, storyboards y operaciones</h2>${scenes}</section>
<section><h2>Banco, herramientas, piezas, bandejas y dependencias</h2>
  ${workbenchRows
    ? `<p>Banco semántico bajo demanda. Herramientas, piezas y tornillos conservan identidad; desmontaje y montaje usan grafos separados. El detalle pieza por pieza está en <code>generated/miyota2035-audit.*</code> y el contrato ejecutable en <code>dist/workbench-report.md</code>.</p><table><thead><tr><th>Actividad</th><th>Fixture</th><th>Modos</th><th>Zonas y bandejas</th><th>Contexto de evidencia</th><th>Evidencias</th><th>Rúbrica</th></tr></thead><tbody>${workbenchRows}</tbody></table>`
    : '<p>Este paquete no declara banco virtual.</p>'}
</section>
<section><h2>Laboratorio mecánico, cálculos, grafos y modos</h2>
  ${mechanicalRows
    ? `<p>Laboratorio semántico bajo demanda con modelo conceptual y comparación 8215 separada. Las relaciones, fórmulas, entradas, unidades, redondeo, G/K/P y limitaciones forman parte del contrato.</p><table><thead><tr><th>Actividad</th><th>Subsistema</th><th>Comandos</th><th>Vistas</th><th>Física</th><th>Reduced motion</th><th>Rúbrica</th></tr></thead><tbody>${mechanicalRows}</tbody></table>`
    : '<p>Este paquete no declara laboratorio mecánico.</p>'}
</section>
<section><h2>Laboratorio de calibre, operaciones y autoridad</h2>
  ${calibreRows
    ? `<p>Las identidades de instancia, las fases y la autoridad de cada operación forman parte del contrato ejecutable. El fixture real y los laboratorios conceptuales permanecen separados; la alternativa textual y reduced motion conservan la misma evaluación.</p><table><thead><tr><th>Actividad</th><th>Fixture</th><th>Modos</th><th>Subsistemas</th><th>Fases</th><th>Laboratorios contextuales</th><th>Autoridad</th><th>Identidad</th><th>Reduced motion</th></tr></thead><tbody>${calibreRows}</tbody></table>`
    : '<p>Este paquete no declara laboratorio de calibre.</p>'}
</section>
<section><h2>Competencias, evidencia y rúbricas</h2><table><thead><tr><th>Competencia</th><th>Descripción</th><th>Evidencia</th><th>Rúbricas</th></tr></thead><tbody>${competencies}</tbody></table></section>
<section><h2>Fuentes</h2><table><thead><tr><th>ID</th><th>Autoridad</th><th>Recurso</th><th>Localizador</th><th>Claim respaldado</th></tr></thead><tbody>${sources}</tbody></table></section>
<section><h2>Glosario</h2><table><thead><tr><th>ID</th><th>ES</th><th>EN</th><th>Definición</th></tr></thead><tbody>${glossary}</tbody></table></section>
<section><h2>Recursos visuales</h2><table><thead><tr><th>ID</th><th>Tipo</th><th>Estado</th><th>Prioridad</th><th>G/K/P</th><th>Modelo actual</th><th>Cardinalidad</th></tr></thead><tbody>${resources}</tbody></table></section>
<section><h2>Warnings declarados</h2>${list(warnings)}</section>
<section><h2>Diagnósticos</h2><ul>${issues || '<li>Sin diagnósticos.</li>'}</ul></section></body></html>`
}

async function writeGenerated(root: string, pack: LearningPack, assetBytes: Array<{ assetId: string; bytes: Uint8Array }>): Promise<void> {
  const output = resolve(root, 'dist')
  await mkdir(output, { recursive: true })
  await Promise.all([
    writeFile(resolve(output, 'pack.json'), `${JSON.stringify(pack, null, 2)}\n`, 'utf8'),
    writeFile(resolve(output, `${pack.manifest.id}-${pack.manifest.packageVersion}.wplab-learning.zip`), encodeLearningPackage(pack, assetBytes)),
    writeFile(resolve(output, 'visual-needs.json'), `${JSON.stringify(validateAuthoringPack(pack).visualNeeds, null, 2)}\n`, 'utf8'),
    writeFile(resolve(output, 'visual-needs.md'), visualNeedsAsMarkdown(pack), 'utf8'),
  ])
}

export async function runAuthoringCommand(command: AuthoringCommand, root: string): Promise<number> {
  const materialized = await materializeAuthoringWorkspace(root)
  const report = validateAuthoringPack(materialized.input)
  if (!report.pack) {
    printDiagnostics(report.diagnostics)
    return 1
  }
  const compilationDiagnostics = compileScenes(report.pack)
  const diagnostics = [...report.diagnostics, ...compilationDiagnostics]
  const hasErrors = diagnostics.some(({ severity }) => severity === 'error')

  if (command === 'lint' || command === 'validate') printDiagnostics(diagnostics)
  if (command === 'validate') {
    console.log(`Validación: ${hasErrors ? 'FALLIDA' : 'CORRECTA'} · ${report.pack.manifest.id}@${report.pack.manifest.packageVersion}`)
  }
  if (command === 'pack' && !hasErrors) {
    await writeGenerated(root, report.pack, materialized.assetBytes)
    console.log(`Paquete generado en ${relative(process.cwd(), resolve(root, 'dist'))}.`)
  }
  if (command === 'visual-report' && !hasErrors) {
    await writeGenerated(root, report.pack, materialized.assetBytes)
    console.log(`Informe visual generado en ${relative(process.cwd(), resolve(root, 'dist', 'visual-needs.md'))}.`)
  }
  if (command === 'preview' && !hasErrors) {
    await writeGenerated(root, report.pack, materialized.assetBytes)
    const previewPath = resolve(root, 'dist', 'preview.html')
    await writeFile(previewPath, previewHtml(report.pack, diagnostics), 'utf8')
    console.log(`Preview generado en ${relative(process.cwd(), previewPath)}.`)
  }
  return hasErrors ? 1 : 0
}

async function main(): Promise<void> {
  const command = (process.argv[2] ?? 'validate') as AuthoringCommand
  if (!['validate', 'lint', 'preview', 'pack', 'visual-report'].includes(command)) {
    throw new Error(`Comando desconocido: ${command}.`)
  }
  const scriptDirectory = dirname(fileURLToPath(import.meta.url))
  const defaultRoot = resolve(scriptDirectory, '..', 'learning-content', 'example')
  const root = resolve(process.argv[3] ?? defaultRoot)
  process.exitCode = await runAuthoringCommand(command, root)
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  await main()
}
