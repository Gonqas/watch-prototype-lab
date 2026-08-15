import type { AcademySourceLocator, AcademyStage0ClaimReview } from '../types'

export function academyStage0SourceLocator(
  sourceId: string,
  documentLocator: string,
  options: Omit<AcademySourceLocator, 'sourceId' | 'documentLocator'>,
): AcademySourceLocator {
  return { sourceId, documentLocator, ...options }
}

const bulova = (page: string, figure?: string): AcademySourceLocator => academyStage0SourceLocator(
  'source.private.bulova.preliminary',
  'reference-library/originals/Joseph Bulova School of Watch Making.pdf',
  { page, ...(figure ? { figure } : {}), verificationMethod: 'visual-pdf-inspection', verifiedAt: '2026-08-15' },
)

export const ACADEMY_STAGE_0_CLAIM_REVIEWS: readonly AcademyStage0ClaimReview[] = [
  {
    claimId: 'claim.014f.stage0.workstation-recoverable-state',
    lessonId: 'lesson.quartz2035.workstation',
    sectionId: 'reader.section.block.quartz2035.workstation.014f-estado-de-la-sesion',
    claim: 'El orden del banco y el registro del estado forman parte de los hábitos de trabajo que preceden a la práctica relojera.',
    technicalStatus: 'source-reviewed',
    sourceIds: ['source.private.bulova.preliminary'],
    locators: [bulova('PDF 5 / impresa 3'), bulova('PDF 6 / impresa 4', 'Fig. 1')],
    limitations: ['La fuente histórica no define una distribución moderna universal ni el método local de notas.'],
  },
  {
    claimId: 'claim.014f.stage0.bulova-basic-tools',
    lessonId: 'lesson.quartz2035.tools',
    sectionId: 'reader.section.block.quartz2035.tools.014f-familias-y-funcion',
    claim: 'La unidad preliminar de Bulova introduce lupa, pinzas y destornillador como herramientas básicas para desarrollar control inicial.',
    technicalStatus: 'source-reviewed',
    sourceIds: ['source.private.bulova.preliminary'],
    locators: [bulova('PDF 6 / impresa 4', 'Fig. 1'), bulova('PDF 7 / impresa 5', 'Figs. 2–4')],
    limitations: ['Se conserva la función pedagógica; no se trasladan duración, evaluación escolar ni práctica sobre componentes de reloj.'],
  },
  {
    claimId: 'claim.014f.stage0.bench-environment',
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad',
    sectionId: 'reader.section.block.encyclopedia.workshop-tools-materials.banco-y-seguridad.014f-entorno-controlado',
    claim: 'Luz, postura, orden y contención condicionan la capacidad de observar y conservar el estado del trabajo.',
    technicalStatus: 'source-limited',
    sourceIds: ['source.private.daniels.workshop-equipment', 'source.institutional.awci.standards'],
    locators: [
      academyStage0SourceLocator('source.private.daniels.workshop-equipment', 'reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf', { section: 'Workshop and Equipment', verificationMethod: 'curated-inventory' }),
      academyStage0SourceLocator('source.institutional.awci.standards', 'Registro canónico 0.14A · estándares institucionales AWCI', { section: 'workshop practices', verificationMethod: 'source-limited' }),
    ],
    limitations: ['No se han verificado parámetros numéricos ni requisitos ergonómicos profesionales.'],
  },
  {
    claimId: 'claim.014f.stage0.observation-before-inference',
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion',
    sectionId: 'reader.section.block.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion.014f-observar-interpretar',
    claim: 'Una observación debe separarse de la interpretación y de la hipótesis que luego se somete a comprobación.',
    technicalStatus: 'source-limited',
    sourceIds: ['source.official.tm9-1575.diagnosis'],
    locators: [academyStage0SourceLocator('source.official.tm9-1575.diagnosis', 'reference-library/originals/TM 9-1575.pdf', { section: 'inspection and diagnosis method', verificationMethod: 'source-limited' })],
    limitations: ['Se utiliza el patrón metodológico; tolerancias, sustancias y procedimientos históricos no se trasladan.'],
  },
  {
    claimId: 'claim.014f.stage0.contamination-transfer',
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza',
    sectionId: 'reader.section.block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza.014f-mapa-de-transferencia',
    claim: 'Manos, herramientas, superficies, recipientes y aire pueden formar rutas de transferencia que deben interrumpirse antes de una limpieza química.',
    technicalStatus: 'source-limited',
    sourceIds: ['source.institutional.awci.standards', 'source.private.daniels.workshop-equipment'],
    locators: [
      academyStage0SourceLocator('source.institutional.awci.standards', 'Registro canónico 0.14A · estándares institucionales AWCI', { section: 'workshop practices', verificationMethod: 'source-limited' }),
      academyStage0SourceLocator('source.private.daniels.workshop-equipment', 'reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf', { section: 'Workshop and Equipment', verificationMethod: 'curated-inventory' }),
    ],
    limitations: ['No identifica sustancias, compatibilidad ni un procedimiento de limpieza.'],
  },
  {
    claimId: 'claim.014f.stage0.bulova-practice-progression',
    lessonId: 'lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica',
    sectionId: 'reader.section.block.encyclopedia.workshop-tools-materials.bulova-destreza-basica.014f-coordinacion',
    claim: 'La unidad preliminar de Bulova presenta coordinación ojo, atención y manos y progresa mediante ejercicios de pinzas y destornillador.',
    technicalStatus: 'source-reviewed',
    sourceIds: ['source.private.bulova.preliminary'],
    locators: [
      bulova('PDF 5 / impresa 3'),
      bulova('PDF 6 / impresa 4', 'Fig. 1'),
      bulova('PDF 7 / impresa 5', 'Figs. 2–4'),
      bulova('PDF 9 / impresa 7', 'Figs. 6–7'),
    ],
    limitations: ['La adaptación 0.14F usa material de entrenamiento de poco valor y no reproduce la evaluación ni las operaciones históricas.'],
  },
] as const
