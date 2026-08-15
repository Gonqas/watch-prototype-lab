import { resolve } from 'node:path'
import { runAcademy014G, runAcademy014GTests } from './academy-014g'

const count = await runAcademy014G(resolve('.'), { check: process.argv.includes('--check'), scope: 'persistence' })
const testFiles = await runAcademy014GTests(resolve('.'), 'persistence')
console.log(`Persistencia 0.14G: ${count} informes verificados/generados y ${testFiles} archivos de prueba.`)
