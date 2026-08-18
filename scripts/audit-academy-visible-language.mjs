import { LEARNER_FACING_KEYS } from './academy-editorial/student-copy.mjs'
import { resolveStage05Scope } from './academy-editorial/stage05-scope.mjs'

const forbidden = /\b(?:runtime|fixtures?|WatchProject|snapshots?|claims?|retained|viewport|checkpoints?|ledger|remove-before|add-after|part-of|fastened-by|not-verified|planned-only|rollbacks?|source-needed|source-limited|source-reviewed|not-reviewed|documentally-compatible|dimensionally-defined|primary-source|secondary-reference|specifications?|drawings?|parts lists?|instruction manuals?|movement[- ]holder)\b/iu
const internalId = /\b(?:lesson|activity|concept|source|block|module|route|scene|term|visual|fixture|claim)\.[a-z0-9_.-]+\b/iu
const unnatural = /¿Qué relación\s+(?:retirar antes de|de retirada previa)|\blos referencias geométricas\b|\bmétodo de aro portamovimiento\b|\b(?:identificar|explicar) y explicar [^.!?]+ con fuentes\b|\bse reconoce por[^.!?]+\bidentificación del calibre\b|\bcon un modelo estructural, fuentes, operaciones y límites declarados\b/iu

function cleanVisible(value) {
  return value
    .replace(/\{\{[^}]+\}\}/gu, '')
    .replace(/\]\([^)]+\)/gu, ']()')
    .replace(/\([^)]*\bmovement holder\b[^)]*\)/giu, '')
    .replace(/https?:\/\/\S+/gu, '')
}

function collect(value, owner, path = '', visible = false, output = []) {
  if (typeof value === 'string') {
    if (visible) output.push({ owner, path, value })
    return output
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collect(item, owner, `${path}[${index}]`, visible, output))
    return output
  }
  if (!value || typeof value !== 'object') return output
  for (const [key, item] of Object.entries(value)) {
    collect(item, owner, path ? `${path}.${key}` : key, visible || LEARNER_FACING_KEYS.has(key), output)
  }
  return output
}

const scope = await resolveStage05Scope()
const findings = []
for (const pkg of scope.packages) {
  for (const records of pkg.targets.values()) {
    for (const { value } of records) {
      for (const field of collect(value, value.id)) {
        const clean = cleanVisible(field.value)
        const problem = forbidden.exec(clean)?.[0] ?? internalId.exec(clean)?.[0] ?? unnatural.exec(clean)?.[0]
        if (problem) findings.push({ package: pkg.packageName, ...field, problem })
      }
    }
  }
}

if (findings.length) {
  console.error(`Auditoría de lenguaje visible: ${findings.length} incidencias en etapas 0–5.`)
  for (const finding of findings.slice(0, 100)) {
    console.error(`- ${finding.package} · ${finding.owner} · ${finding.path} · ${finding.problem}: ${finding.value.slice(0, 220)}`)
  }
  process.exitCode = 1
} else {
  console.log(`Auditoría de lenguaje visible: OK · ${scope.targetLessons.size} lecciones de etapas 0–5 · 0 fugas conocidas.`)
}
