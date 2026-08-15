import { resolve } from 'node:path'
import { runAcademy014G, runAcademy014GTests } from './academy-014g'

const count = await runAcademy014G(resolve('.'), { check: process.argv.includes('--check'), scope: 'stage1' })
const testFiles = await runAcademy014GTests(resolve('.'), 'stage1')
console.log(`Curación de etapa 1 · 0.14G: ${count} informes verificados/generados y ${testFiles} archivo de prueba.`)
