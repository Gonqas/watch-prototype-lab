import type { AcademyStage4EditorialArchetype } from '../types'

export interface AcademyStage4EditorialContract {
  whyNow: string
  editorialArchetype: AcademyStage4EditorialArchetype
  checkpointPrompt: string
  checkpointExpectedElements: readonly string[]
}

const c = (value: AcademyStage4EditorialContract) => value

export const ACADEMY_STAGE_4_EDITORIAL_CONTRACTS: Readonly<Record<string, AcademyStage4EditorialContract>> = {
  'lesson.miyota8215.identify': c({ whyNow: 'La entrada al calibre exige una identidad demostrable antes de interpretar sus sistemas.', editorialArchetype: 'calibre-identification', checkpointPrompt: 'Justifica una identificación provisional del 8215.', checkpointExpectedElements: ['rasgo observable', 'inscripción o referencia', 'documento oficial', 'variante y límite'] }),
  'lesson.miyota8215.documentation': c({ whyNow: 'Una pregunta técnica solo es defendible cuando se dirige al documento con autoridad adecuada.', editorialArchetype: 'document-reading', checkpointPrompt: 'Elige el documento para una pregunta concreta y limita la conclusión.', checkpointExpectedElements: ['pregunta', 'documento y localizador', 'dato', 'conclusión permitida y no permitida'] }),
  'lesson.miyota8215.architecture': c({ whyNow: 'La teoría de sistemas se transfiere ahora a un calibre documentado sin convertir el modelo en geometría real.', editorialArchetype: 'calibre-architecture', checkpointPrompt: 'Reconstruye las capas funcionales del 8215.', checkpointExpectedElements: ['subsistemas', 'interfaces', 'piezas oficiales', 'relaciones inferidas y desconocidos'] }),
  'lesson.miyota8215.automatic': c({ whyNow: 'El sistema automático permite separar identidad oficial de pieza e interpretación funcional.', editorialArchetype: 'subsystem', checkpointPrompt: 'Sigue la función automática sin inventar cinemática.', checkpointExpectedElements: ['entrada', 'piezas oficiales', 'salida funcional', 'relación inferida y límite'] }),
  'lesson.miyota8215.winding-setting': c({ whyNow: 'Los estados externos de corona tienen apoyo documental distinto de la cinemática interna.', editorialArchetype: 'subsystem', checkpointPrompt: 'Relaciona cada posición de corona con la función autorizada.', checkpointExpectedElements: ['posición', 'operación del usuario', 'manual vigente', 'mecanismo interno no demostrado'] }),
  'lesson.miyota8215.barrel-energy': c({ whyNow: 'El barrilete conecta almacenamiento y tren, pero el fixture no abre ni valida su interior.', editorialArchetype: 'subsystem', checkpointPrompt: 'Explica qué está identificado y qué queda cerrado en el barrilete.', checkpointExpectedElements: ['entrada', 'barrel complete', 'puente y retención', 'interior desconocido'] }),
  'lesson.miyota8215.train': c({ whyNow: 'El tren concreta la cadena de energía mediante piezas oficiales y contactos todavía modelados.', editorialArchetype: 'subsystem', checkpointPrompt: 'Clasifica piezas y relaciones del tren por autoridad.', checkpointExpectedElements: ['referencias oficiales', 'orden funcional', 'contactos inferidos', 'dientes y geometría desconocidos'] }),
  'lesson.miyota8215.escapement-oscillator': c({ whyNow: 'Escape y oscilador muestran el límite entre localizar componentes y medir comportamiento.', editorialArchetype: 'subsystem', checkpointPrompt: 'Distingue anatomía documentada y comportamiento físico no medido.', checkpointExpectedElements: ['piezas oficiales', 'interfaz conceptual', 'magnitudes no simuladas', 'prueba real pendiente'] }),
  'lesson.miyota8215.calendar': c({ whyNow: 'El apoyo de calendario relaciona piezas y operación externa sin imponer el cambio interno como fundamento.', editorialArchetype: 'subsystem', checkpointPrompt: 'Explica el ajuste rápido y su límite documental.', checkpointExpectedElements: ['posición de corona', 'advertencia 8215', 'piezas oficiales', 'secuencia interna desconocida'] }),
  'lesson.miyota8215.plan-disassembly': c({ whyNow: 'Antes de mover el modelo se planifican objetivo, dependencias, registro y desconocidos.', editorialArchetype: 'structural-dependency', checkpointPrompt: 'Construye un plan reversible del laboratorio.', checkpointExpectedElements: ['objetivo y estado inicial', 'dependencias', 'checkpoints', 'frontera con procedimiento físico'] }),
  'lesson.miyota8215.guided-disassembly': c({ whyNow: 'La secuencia guiada comprueba dependencias del simulador, no técnica de banco.', editorialArchetype: 'virtual-sequence', checkpointPrompt: 'Audita un paso virtual por fundamento y alcance.', checkpointExpectedElements: ['estado inicial', 'acción virtual', 'dependencia mostrada', 'inferencia y límite físico'] }),
  'lesson.miyota8215.assisted-free-disassembly': c({ whyNow: 'Reducir ayuda evalúa el modelo mental y la documentación, nunca fuerza o destreza.', editorialArchetype: 'virtual-sequence', checkpointPrompt: 'Reconstruye una secuencia del laboratorio con menos ayuda.', checkpointExpectedElements: ['plan', 'dependencias', 'registro', 'competencias físicas excluidas'] }),
  'lesson.miyota8215.inspection': c({ whyNow: 'La inspección simbólica permite formular hipótesis sin falsificar el aspecto de una pieza real.', editorialArchetype: 'symbolic-inspection', checkpointPrompt: 'Registra un escenario sin convertir el símbolo en defecto físico.', checkpointExpectedElements: ['símbolo', 'observación válida', 'hipótesis rivales', 'prueba física necesaria'] }),
  'lesson.miyota8215.assembly-verification': c({ whyNow: 'El montaje virtual ordena capas y verificaciones internas sin prescribir servicio.', editorialArchetype: 'virtual-assembly', checkpointPrompt: 'Coloca un control entre dos capas del modelo.', checkpointExpectedElements: ['capa', 'dependencia', 'verificación del simulador', 'aceptación física excluida'] }),
  'lesson.miyota8215.diagnosis-project': c({ whyNow: 'El cierre integra evidencia, hipótesis, prueba y procedencia en un dossier revisable.', editorialArchetype: 'traceable-dossier', checkpointPrompt: 'Defiende una conclusión sobre el escenario y sus límites.', checkpointExpectedElements: ['síntoma simulado', 'hipótesis y prueba', 'resultado', 'fuente y dato físico pendiente'] }),
  'lesson.advanced.service-disassembly': c({ whyNow: 'La rama opcional organiza dependencias y fuentes sin convertirse en procedimiento físico avanzado.', editorialArchetype: 'structural-dependency', checkpointPrompt: 'Declara qué necesitaría una futura decisión física.', checkpointExpectedElements: ['objetivo', 'dependencia', 'documentación aplicable', 'procedimiento pendiente'] }),
}

export function academyStage4EditorialContract(lessonId: string) {
  const result = ACADEMY_STAGE_4_EDITORIAL_CONTRACTS[lessonId]
  if (!result) throw new Error(`Falta el contrato editorial de etapa 4 para ${lessonId}.`)
  return result
}
