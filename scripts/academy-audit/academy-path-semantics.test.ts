import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ACADEMY_0_14B_BASELINE_SHA256,
  ACADEMY_PATH_SEMANTIC_OUTPUT_FILES,
  buildAcademyPathSemanticOutputs,
  verifyAcademy014BBaselines,
} from '../academy-path-semantics'

describe('informes de semántica de ruta 0.14B.1', () => {
  it('conserva byte por byte los siete informes 0.14B', async () => {
    await expect(verifyAcademy014BBaselines(process.cwd())).resolves.toBeUndefined()
    expect(Object.keys(ACADEMY_0_14B_BASELINE_SHA256)).toHaveLength(7)
  })

  it('genera siete informes completos y deterministas', async () => {
    const first = await buildAcademyPathSemanticOutputs(process.cwd())
    const second = await buildAcademyPathSemanticOutputs(process.cwd())
    expect([...first]).toEqual([...second])
    expect([...first.keys()]).toEqual([...ACADEMY_PATH_SEMANTIC_OUTPUT_FILES])
    expect(first.get('ACADEMY-PATH-SEMANTICS-0.14B1.md')).toContain('83 `AcademyLearnerStep`')
    expect(first.get('ACADEMY-PROGRESS-STATE-MODEL-0.14B1.md')).toContain('retention-due')
    expect(first.get('ACADEMY-STAGE-5-CONTENT-BLUEPRINT-0.14B1.md')).toContain('Autoridad primaria de datos')
  }, 15_000)

  it('impide nuevas lecturas directas no justificadas del locale de perfil', async () => {
    const root = join(process.cwd(), 'src', 'learning')
    const files = (await readdir(root, { recursive: true }))
      .filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes('.test.'))
    const violations: string[] = []
    for (const file of files) {
      const source = await readFile(join(root, file), 'utf8')
      if (/profile\??\.locale\s*(?:===|!==)|profile\??\.locale\.(?:startsWith|endsWith|includes)/.test(source)) violations.push(file)
    }
    expect(violations).toEqual([])
  })
})
