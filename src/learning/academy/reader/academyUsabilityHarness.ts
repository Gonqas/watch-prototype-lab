import type { AcademyUsabilitySession } from './academyReaderModel'

export const ACADEMY_USABILITY_TASKS = [
  ['usability.find-first-study', 'Encontrar qué estudiar primero', '#/learning/home'],
  ['usability.open-system', 'Abrir “El reloj como sistema”', '#/learning/lesson/lesson.horology.system'],
  ['usability.explain-chain', 'Explicar la cadena mecánica', '#/learning/lesson/lesson.horology.mechanical-chain'],
  ['usability.switch-read', 'Cambiar a Lectura', '#/learning/lesson/lesson.horology.mechanical-chain?mode=read'],
  ['usability.return-learn', 'Volver a Aprender', '#/learning/lesson/lesson.horology.mechanical-chain?mode=learn'],
  ['usability.interpret-gears', 'Interpretar una pareja de engranajes', '#/learning/lesson/lesson.mechanical.gear-pair'],
  ['usability.resume', 'Reanudar una lección interrumpida', '#/learning/home'],
  ['usability.open-8215', 'Abrir arquitectura del 8215', '#/learning/lesson/lesson.miyota8215.architecture'],
  ['usability.locate-subsystem', 'Localizar un subsistema', '#/learning/lesson/lesson.miyota8215.architecture'],
  ['usability.finish-to-practice', 'Terminar una lección y llegar a su práctica', '#/learning/lesson/lesson.horology.system'],
  ['usability.section-bookmark', 'Volver mediante un marcador de apartado', '#/learning/notebook'],
  ['usability.source-position', 'Consultar una fuente sin perder la posición', '#/learning/lesson/lesson.mechanical.train'],
] as const

export function academyUsabilitySessionJson(session: AcademyUsabilitySession): string {
  return JSON.stringify({ format: 'wplab-usability-session', version: '0.14D', session }, null, 2)
}
