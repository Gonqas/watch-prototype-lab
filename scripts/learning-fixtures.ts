import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createTechnicalVisualReport,
  renderTechnicalVisualReportMarkdown,
} from '../src/learning/technical/visualReport'

const outputDirectory = resolve('learning-content/horology-foundations/generated')
const jsonPath = resolve(outputDirectory, 'fixture-visual-report.json')
const markdownPath = resolve(outputDirectory, 'fixture-visual-report.md')

await mkdir(outputDirectory, { recursive: true })
const report = createTechnicalVisualReport()
await Promise.all([
  writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
  writeFile(markdownPath, renderTechnicalVisualReportMarkdown(report), 'utf8'),
])

console.log(`Informe JSON: ${jsonPath}`)
console.log(`Informe Markdown: ${markdownPath}`)
console.log(`Fixtures: ${report.fixtures.length}`)
console.log(`Compilación técnica: ${report.moduleFixtureCompiled ? 'correcta' : 'fallida'}`)
console.log(`Bloqueos visuales explícitos: ${report.moduleViewportBlockers.length}`)
