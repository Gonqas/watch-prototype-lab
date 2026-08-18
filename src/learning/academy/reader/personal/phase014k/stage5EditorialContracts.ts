import type { AcademyStage5EditorialArchetype } from '../types'

export interface AcademyStage5EditorialContract {
  editorialArchetype: AcademyStage5EditorialArchetype
  whyNow: string
  sourceBoundary: string
  checkpointExpectedElements: readonly string[]
}

const byChapter: Record<string, AcademyStage5EditorialContract> = {
  'chapter.5.1': { editorialArchetype:'requirements-definition', whyNow:'Primero se fija qué reloj se quiere integrar y qué evidencia permitiría comprobarlo.', sourceBoundary:'MIYOTA 8215 sirve como ejemplo documentado; no es la única opción ni sus cotas se generalizan.', checkpointExpectedElements:['requisito medible o dato pendiente','autoridad del dato','razón de la elección'] },
  'chapter.5.2': { editorialArchetype:'dimensional-chain', whyNow:'Caja, aro y mando fijan las referencias geométricas principales antes de añadir la indicación.', sourceBoundary:'No se diseña un aro fabricable ni se corta o rosca una tija sin cotas aplicables.', checkpointExpectedElements:['referencia geométrica','interfaces','margen o dato pendiente','condición de parada'] },
  'chapter.5.3': { editorialArchetype:'interface-analysis', whyNow:'Esfera, pies y agujas se comprueban sobre la estructura ya definida.', sourceBoundary:'Igualdad nominal no demuestra ajuste; toda adaptación física se remite a etapa 6.', checkpointExpectedElements:['dos caras de la interfaz','altura con referencia geométrica','barrido pendiente'] },
  'chapter.5.4': { editorialArchetype:'dynamic-clearance', whyNow:'Cristal, fondo y juntas cierran el volumen y exigen separar modelo, ensayo y resultado.', sourceBoundary:'Sin ensayo real documentado la hermeticidad permanece no verificada.', checkpointExpectedElements:['estado estático','estado dinámico','entrada ausente','límite físico'] },
  'chapter.5.5': { editorialArchetype:'integration-dossier', whyNow:'El dossier integra decisiones, datos pendientes y conflictos sin declarar un reloj físico terminado.', sourceBoundary:'Semejanza visual, misma marca o ausencia de colisión digital no prueban compatibilidad.', checkpointExpectedElements:['procedencia','matriz','plan reversible','validación física pendiente'] },
}

export function academyStage5EditorialContract(chapterId: string): AcademyStage5EditorialContract {
  const contract = byChapter[chapterId]
  if (!contract) throw new Error(`Capítulo de etapa 5 desconocido: ${chapterId}`)
  return contract
}
