import type { AcademyStage5PrerequisiteOverride } from '../types'
import { ACADEMY_STAGE_5_CATALOG } from './stage5Catalog'

export const ACADEMY_STAGE_5_PREREQUISITE_OVERRIDES: readonly AcademyStage5PrerequisiteOverride[] = ACADEMY_STAGE_5_CATALOG.map((item) => ({
  lessonId:item.lessonId,rawConceptIds:[],effectiveRequiredConceptIds:[],recommendedLessonIds:item.chapterId === 'chapter.5.1' ? ['lesson.miyota8215.diagnosis-project'] : [],pathRole:item.pathRole,blocking:item.pathRole === 'anchor',rationale:item.pathRole === 'support' ? 'Support no bloqueante: amplía fabricación o ensayo posterior.' : 'La secuencia 5.1 → 5.5 bloquea por método, nunca por compra, ejecución física o revisión externa.',phase:'0.14K',
}))

export const ACADEMY_STAGE_5_TRANSITIONS = [
  {from:'chapter.4.5',to:'chapter.5.1',condition:'método de etapa 4 completado',physicalRequired:false},
  {from:'chapter.5.1',to:'chapter.5.2',condition:'pliego y elección documentada'},
  {from:'chapter.5.2',to:'chapter.5.3',condition:'interfaces estructurales registradas'},
  {from:'chapter.5.3',to:'chapter.5.4',condition:'stack axial abierto o calculado honestamente'},
  {from:'chapter.5.4',to:'chapter.5.5',condition:'cierres e interferencias registrados'},
  {from:'chapter.5.5',to:'chapter.6.1',condition:'dossier metodológico entregado',physicalWatchCompleted:false},
] as const
