export type Academy3dReviewDecision = 'keep' | 'correct' | 'source-needed'
export interface Academy3dReviewRecord { visualStateId: string; decision: Academy3dReviewDecision; reason: string }

export const ACADEMY_PERSONAL_3D_REVIEWS: readonly Academy3dReviewRecord[] = [
  { visualStateId: 'reader.3d.mechanical-train.overview', decision: 'keep', reason: 'Modelo conceptual explícito; no expresa geometría fabricable ni calibre.' },
  { visualStateId: 'reader.3d.mechanical-train.fourth-wheel', decision: 'keep', reason: 'Aísla una interfaz conceptual y conserva la limitación de geometría.' },
  { visualStateId: 'reader.3d.miyota8215.overview', decision: 'keep', reason: 'La documentación oficial respalda identidad y agrupación de piezas, no tolerancias.' },
  { visualStateId: 'reader.3d.miyota8215.train-isolated', decision: 'keep', reason: 'Localiza el tren modelado sin afirmar depthing, desgaste o servicio.' },
  { visualStateId: 'reader.3d.miyota8215.automatic-isolated', decision: 'correct', reason: 'Se elimina toda lectura de ruta cinemática completa no demostrada por el despiece.' },
  { visualStateId: 'reader.3d.miyota8215.rotor-checkpoint', decision: 'correct', reason: 'Se presenta como dependencia entre fijación y pieza, no como primer paso ni dirección de retirada.' },
  { visualStateId: 'reader.3d.miyota8215.barrel-bridge-checkpoint', decision: 'source-needed', reason: 'La agrupación es visible; el orden de desmontaje sigue bloqueado sin manual de servicio.' },
  { visualStateId: 'reader.3d.miyota8215.inspection-train', decision: 'keep', reason: 'La vista localiza un sistema y declara que no demuestra desgaste ni tolerancia.' },
  { visualStateId: 'reader.3d.miyota8215.inspection-support', decision: 'keep', reason: 'La interfaz espacial se muestra sin criterio dimensional de aceptación.' },
] as const


