import type { AcademyStage0PrerequisiteOverride } from '../types'

export const ACADEMY_STAGE_0_PREREQUISITE_OVERRIDES: readonly AcademyStage0PrerequisiteOverride[] = [
  {
    lessonId: 'lesson.quartz2035.workstation',
    rawConceptIds: [],
    effectiveRequiredConceptIds: [],
    recommendedLessonIds: [],
    pathRole: 'anchor',
    blocking: false,
    rationale: 'El puesto de trabajo es el punto de entrada y no exige el mapa funcional de una etapa posterior.',
    phase: '0.14F',
  },
  {
    lessonId: 'lesson.quartz2035.tools',
    rawConceptIds: ['concept.quartz2035.prepare-safe-workstation'],
    effectiveRequiredConceptIds: ['concept.quartz2035.prepare-safe-workstation'],
    recommendedLessonIds: ['lesson.quartz2035.workstation'],
    pathRole: 'anchor',
    blocking: true,
    rationale: 'La elección de herramientas parte de un banco preparado y no requiere teoría relojera posterior.',
    phase: '0.14F',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
    rawConceptIds: [],
    effectiveRequiredConceptIds: [],
    recommendedLessonIds: ['lesson.quartz2035.workstation', 'lesson.quartz2035.tools'],
    pathRole: 'support',
    blocking: false,
    rationale: 'Amplía el capítulo 0.1 y permanece disponible como apoyo sin bloquear la ruta principal.',
    phase: '0.14F',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    rawConceptIds: [
      'concept.encyclopedia.workshop-tools-materials.banco-y-seguridad.zona-de-trabajo-controlada',
      'concept.encyclopedia.workshop-tools-materials.banco-y-seguridad.control-de-piezas',
      'concept.encyclopedia.workshop-tools-materials.banco-y-seguridad.parada-segura',
    ],
    effectiveRequiredConceptIds: [
      'concept.quartz2035.prepare-safe-workstation',
      'concept.quartz2035.select-basic-tools',
    ],
    recommendedLessonIds: [
      'lesson.quartz2035.workstation',
      'lesson.quartz2035.tools',
      'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
    ],
    pathRole: 'anchor',
    blocking: true,
    rationale: 'La lección de apoyo profundiza el entorno, pero sus tres conceptos no pueden convertirse en un bloqueo indirecto del anchor.',
    phase: '0.14F',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    rawConceptIds: [
      'concept.encyclopedia.workshop-tools-materials.tratamiento-termico-y-superficies.temple',
      'concept.encyclopedia.workshop-tools-materials.tratamiento-termico-y-superficies.revenido',
      'concept.encyclopedia.workshop-tools-materials.tratamiento-termico-y-superficies.integridad-superficial',
    ],
    effectiveRequiredConceptIds: [
      'concept.quartz2035.prepare-safe-workstation',
      'concept.quartz2035.select-basic-tools',
    ],
    recommendedLessonIds: [
      'lesson.quartz2035.workstation',
      'lesson.quartz2035.tools',
      'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    ],
    pathRole: 'anchor',
    blocking: true,
    rationale: 'Temple, revenido e integridad superficial avanzada no son fundamentos para reconocer una transferencia de contaminación.',
    phase: '0.14F',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    rawConceptIds: [
      'concept.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.contaminante',
      'concept.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.compatibilidad-quimica',
      'concept.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.arrastre-cruzado',
    ],
    effectiveRequiredConceptIds: [],
    recommendedLessonIds: [
      'lesson.quartz2035.workstation',
      'lesson.quartz2035.tools',
      'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    ],
    pathRole: 'support',
    blocking: false,
    rationale: 'La práctica básica de lupa, pinzas y destornillador no requiere química y sigue siendo apoyo opcional.',
    phase: '0.14F',
  },
] as const

const overrideByLessonId = new Map(ACADEMY_STAGE_0_PREREQUISITE_OVERRIDES.map((item) => [item.lessonId, item]))

export function academyStage0PrerequisiteOverride(lessonId: string): AcademyStage0PrerequisiteOverride | undefined {
  return overrideByLessonId.get(lessonId)
}

export function academyStage0EffectivePrerequisiteConceptIds(
  lessonId: string,
  rawConceptIds: readonly string[],
): string[] | undefined {
  const override = academyStage0PrerequisiteOverride(lessonId)
  if (!override) return undefined
  const rawSet = new Set(rawConceptIds)
  const sourceSet = new Set(override.rawConceptIds)
  if (rawSet.size !== sourceSet.size || [...rawSet].some((id) => !sourceSet.has(id))) {
    throw new Error(`Los prerrequisitos fuente de ${lessonId} cambiaron; 0.14F necesita revisión manual.`)
  }
  return [...override.effectiveRequiredConceptIds]
}
