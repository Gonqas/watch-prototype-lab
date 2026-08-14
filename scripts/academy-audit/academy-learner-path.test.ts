import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ACADEMY_PATH_OUTPUT_FILES,
  buildAcademyLearnerPathOutputs,
} from '../academy-learner-path'
import { BASELINE_DIGESTS, SEMANTIC_OUTPUT_FILES } from '../academy-semantic-audit'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))

describe('artefactos de ruta 0.14B', () => {
  it('genera las siete salidas de forma determinista y coincide con disco', async () => {
    const first = await buildAcademyLearnerPathOutputs(repositoryRoot)
    const second = await buildAcademyLearnerPathOutputs(repositoryRoot)
    expect([...first.entries()]).toEqual([...second.entries()])
    expect([...first.keys()]).toEqual([...ACADEMY_PATH_OUTPUT_FILES])
    for (const [fileName, content] of first) {
      expect(await readFile(join(repositoryRoot, 'docs', 'generated', fileName), 'utf8'), fileName).toBe(content)
    }
  }, 30_000)

  it('mantiene byte a byte los baselines 0.14A y conserva todas las salidas 0.14A.1', async () => {
    for (const [fileName, expected] of Object.entries(BASELINE_DIGESTS)) {
      const digest = createHash('sha256').update(await readFile(join(repositoryRoot, 'docs', 'generated', fileName))).digest('hex')
      expect(digest, fileName).toBe(expected)
    }
    for (const fileName of SEMANTIC_OUTPUT_FILES) {
      expect((await readFile(join(repositoryRoot, 'docs', 'generated', fileName), 'utf8')).length, fileName).toBeGreaterThan(0)
    }
  })

  it('no usa docs/generated como base de datos del runtime', async () => {
    const runtimeFiles = [
      'src/learning/academy/path/academyLearnerPath.ts',
      'src/learning/academy/path/academyPathProgress.ts',
      'src/learning/academy/path/academyNextAction.ts',
      'src/learning/academy/path/academyPathPrerequisites.ts',
      'src/learning/academy/path/academyPathValidation.ts',
    ]
    for (const relativePath of runtimeFiles) {
      expect(await readFile(join(repositoryRoot, relativePath), 'utf8'), relativePath).not.toContain('docs/generated')
    }
  })
})
