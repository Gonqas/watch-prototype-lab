import type { AcademyStage0LessonCuration } from '../types'
import { ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS } from './stage0Activities'
import { ACADEMY_STAGE_0_SECTIONS } from './stage0Sections'

const activitiesFor = (lessonId: string) => ACADEMY_STAGE_0_ACTIVITY_PRESENTATIONS.filter((item) => item.lessonId === lessonId)

export const ACADEMY_STAGE_0_LESSON_IDS = [
  'lesson.quartz2035.workstation',
  'lesson.quartz2035.tools',
  'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
  'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
  'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
  'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
] as const

export const ACADEMY_STAGE_0_LESSON_CURATIONS: readonly AcademyStage0LessonCuration[] = [
  {
    lessonId: 'lesson.quartz2035.workstation',
    sourceBlockId: 'block.quartz2035.workstation',
    centralQuestion: '¿Cómo preparo un espacio donde cada pieza tenga un lugar y pueda detener el trabajo sin perder el estado?',
    whyNow: 'Empiezas por el entorno porque el orden, la luz y una pausa recuperable protegen cualquier trabajo posterior.',
    observableOutcome: 'Organizar un banco sencillo, asignar una zona a cada elemento y dejar una sesión documentada para reanudarla.',
    recommendedPrerequisiteLessonIds: [],
    effectivePrerequisiteConceptIds: [],
    sections: ACADEMY_STAGE_0_SECTIONS['lesson.quartz2035.workstation'],
    visualDesignIds: ['visual.stage0.bench-map.v1'],
    activityPresentations: activitiesFor('lesson.quartz2035.workstation'),
    sourceClaimIds: ['claim.014f.stage0.workstation-recoverable-state'],
    limitations: ['No exige mobiliario profesional, maquinaria ni un calibre concreto.'],
    personalReviewStatus: 'not-reviewed',
    technicalStatus: 'source-limited',
  },
  {
    lessonId: 'lesson.quartz2035.tools',
    sourceBlockId: 'block.quartz2035.tools',
    centralQuestion: '¿Cómo elijo y controlo una herramienta antes de tocar una pieza?',
    whyNow: 'Con el espacio bajo control ya puedes relacionar cada operación con el contacto que debe realizar y el daño que debe evitar.',
    observableOutcome: 'Elegir lupa, pinzas, destornillador, soporte o recipiente por su función y rechazar una opción inestable o dañada.',
    recommendedPrerequisiteLessonIds: ['lesson.quartz2035.workstation'],
    effectivePrerequisiteConceptIds: ['concept.quartz2035.prepare-safe-workstation'],
    sections: ACADEMY_STAGE_0_SECTIONS['lesson.quartz2035.tools'],
    visualDesignIds: ['visual.stage0.eye-loupe-part-axis.v1', 'visual.stage0.tweezers-control.v1', 'visual.stage0.screwdriver-fit.v1'],
    activityPresentations: activitiesFor('lesson.quartz2035.tools'),
    sourceClaimIds: ['claim.014f.stage0.bulova-basic-tools'],
    limitations: ['No fija marcas, medidas de hoja ni herramientas oficiales de un calibre.'],
    personalReviewStatus: 'not-reviewed',
    technicalStatus: 'source-reviewed',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
    sourceBlockId: 'block.encyclopedia.workshop-tools-materials.banco-y-seguridad',
    centralQuestion: '¿Cómo afecta el entorno al resultado y a mi capacidad de trabajar?',
    whyNow: 'Esta ampliación opcional conecta postura, atención, orden y seguridad con la calidad de lo que puedes observar y conservar.',
    observableOutcome: 'Reconocer condiciones que permiten trabajar con control y decidir cuándo detenerse o no empezar.',
    recommendedPrerequisiteLessonIds: ['lesson.quartz2035.workstation', 'lesson.quartz2035.tools'],
    effectivePrerequisiteConceptIds: [],
    sections: ACADEMY_STAGE_0_SECTIONS['lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad'],
    visualDesignIds: ['visual.stage0.parts-session-control.v1'],
    activityPresentations: activitiesFor('lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad'),
    sourceClaimIds: ['claim.014f.stage0.bench-environment'],
    limitations: ['No establece parámetros ergonómicos o ambientales universales.'],
    personalReviewStatus: 'not-reviewed',
    technicalStatus: 'source-limited',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    sourceBlockId: 'block.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    centralQuestion: '¿Cómo observo y sujeto sin dañar ni interpretar demasiado pronto?',
    whyNow: 'Después de preparar banco y herramientas, necesitas separar lo visible de lo supuesto antes de formular un diagnóstico.',
    observableOutcome: 'Registrar una observación neutral, cambiar una condición óptica cada vez y manipular una pieza de práctica con apoyo.',
    recommendedPrerequisiteLessonIds: ['lesson.quartz2035.workstation', 'lesson.quartz2035.tools', 'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad'],
    effectivePrerequisiteConceptIds: ['concept.quartz2035.prepare-safe-workstation', 'concept.quartz2035.select-basic-tools'],
    sections: ACADEMY_STAGE_0_SECTIONS['lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion'],
    visualDesignIds: ['visual.stage0.eye-loupe-part-axis.v1', 'visual.stage0.tweezers-control.v1'],
    activityPresentations: activitiesFor('lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion'),
    sourceClaimIds: ['claim.014f.stage0.observation-before-inference'],
    limitations: ['Una simulación o ilustración no reproduce el aspecto real de daño o suciedad.'],
    personalReviewStatus: 'not-reviewed',
    technicalStatus: 'source-limited',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    sourceBlockId: 'block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    centralQuestion: '¿Cómo se transfiere la contaminación y cómo interrumpo esa cadena?',
    whyNow: 'Ya puedes observar y manipular; ahora debes reconocer lo que cada contacto puede trasladar aunque no resulte visible.',
    observableOutcome: 'Trazar una ruta de contaminación, elegir un punto de control y detener cualquier limpieza cuya compatibilidad no esté documentada.',
    recommendedPrerequisiteLessonIds: ['lesson.quartz2035.workstation', 'lesson.quartz2035.tools', 'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion'],
    effectivePrerequisiteConceptIds: ['concept.quartz2035.prepare-safe-workstation', 'concept.quartz2035.select-basic-tools'],
    sections: ACADEMY_STAGE_0_SECTIONS['lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza'],
    visualDesignIds: ['visual.bench.contamination-transfer.v1'],
    activityPresentations: activitiesFor('lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza'),
    sourceClaimIds: ['claim.014f.stage0.contamination-transfer'],
    limitations: ['No incluye productos, recetas químicas ni compatibilidades no verificadas.'],
    personalReviewStatus: 'not-reviewed',
    technicalStatus: 'source-limited',
  },
  {
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    sourceBlockId: 'block.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    centralQuestion: '¿Cómo practico el control de la mano y evalúo mi resultado sin arriesgar una pieza valiosa?',
    whyNow: 'Cierra la etapa con repeticiones sencillas que unen observación, apoyo, alineación y una señal de parada.',
    observableOutcome: 'Planificar y documentar una práctica opcional con pinzas o tornillos de entrenamiento, sin confundirla con acreditación.',
    recommendedPrerequisiteLessonIds: ['lesson.quartz2035.workstation', 'lesson.quartz2035.tools', 'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion'],
    effectivePrerequisiteConceptIds: [],
    sections: ACADEMY_STAGE_0_SECTIONS['lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica'],
    visualDesignIds: ['visual.stage0.tweezers-control.v1', 'visual.stage0.screwdriver-fit.v1'],
    activityPresentations: activitiesFor('lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica'),
    sourceClaimIds: ['claim.014f.stage0.bulova-practice-progression'],
    limitations: ['La práctica física es opcional, personal y no certificada; los ejercicios históricos se adaptan a material de entrenamiento.'],
    personalReviewStatus: 'not-reviewed',
    technicalStatus: 'source-reviewed',
  },
] as const

const curationByLessonId = new Map(ACADEMY_STAGE_0_LESSON_CURATIONS.map((item) => [item.lessonId, item]))

export function academyStage0LessonCuration(lessonId: string): AcademyStage0LessonCuration | undefined {
  return curationByLessonId.get(lessonId)
}
