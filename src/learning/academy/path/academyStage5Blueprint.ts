export type AcademyStage5BlueprintStatus = 'gap' | 'partial'

export interface AcademyStage5BlueprintItem {
  blueprintRef: string
  status: AcademyStage5BlueprintStatus
  title: string
  observableObjective: string
  primarySourceIds: string[]
  officialDocumentationNeeded: string[]
  requiredVisual: string
  proposedPractice: string
  evidenceModalities: Array<'K' | 'V' | 'P' | 'R'>
  executionTier: 'simulation' | 'home-bench' | 'specialist-workshop' | 'professional-or-outsourced'
  prerequisiteChapterIds: string[]
  acceptanceCriteria: string[]
  risks: string[]
  technicalWplRelation: string
  productionLessonId: null
}

const COMMON_SOURCES = [
  'source.private.daniels.watchmaking-volume',
  'source.encyclopedia.original-synthesis',
]

export const ACADEMY_STAGE_5_BLUEPRINT: readonly AcademyStage5BlueprintItem[] = [
  {
    blueprintRef: 'stage5-gap.movement-holder', status: 'gap', title: 'Aro o movement holder como interfaz estructural',
    observableObjective: 'Comparar el movimiento, la caja y un aro propuesto y registrar apoyos, retención y cotas desconocidas.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Plano oficial del movimiento elegido', 'Plano de caja y especificación del proveedor del aro'],
    requiredVisual: 'Sección axial y vista explotada con contactos, holguras y sentidos de montaje.',
    proposedPractice: 'Completar una matriz de interfaces y rechazar una propuesta con apoyo o retención insuficiente.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.1'],
    acceptanceCriteria: ['Cada contacto tiene autoridad y cota localizable', 'Los desconocidos permanecen marcados como pendientes'],
    risks: ['Deformación del movimiento', 'Retención insuficiente', 'Transferencia indebida de medidas entre calibres'],
    technicalWplRelation: 'Consumir geometría y envolvente del proyecto técnico sin modificarla automáticamente.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-gap.dial-feet', status: 'gap', title: 'Pies de esfera: posición, fijación y servicio',
    observableObjective: 'Verificar si posición, longitud y fijación de los pies son compatibles con movimiento, aro y caja.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Plano oficial del movimiento con posiciones de pies', 'Plano del proveedor de esfera'],
    requiredVisual: 'Superposición frontal y sección de pie, abrazadera y holgura posterior.',
    proposedPractice: 'Clasificar una interfaz como compatible, adaptada o no verificable y justificar la decisión.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.2'],
    acceptanceCriteria: ['Coincidencias y desviaciones quedan cuantificadas', 'No se propone cortar o soldar sin vía de taller y seguridad'],
    risks: ['Daño de esfera', 'Interferencia con movimiento', 'Adaptación irreversible'],
    technicalWplRelation: 'Añadir una comprobación de interfaz al dossier técnico, no una operación automática.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-gap.dial-diameter', status: 'gap', title: 'Diámetro de esfera y asiento en caja',
    observableObjective: 'Comprobar diámetro, asiento, apertura visible y tolerancia periférica usando documentación aplicable.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Plano de caja', 'Plano o ficha de esfera', 'Requisitos del bisel o rehaut'],
    requiredVisual: 'Sección radial con asiento, apertura, rehaut y tolerancias.',
    proposedPractice: 'Completar un stack dimensional y detectar una esfera que no puede asentarse o queda expuesta.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.2'],
    acceptanceCriteria: ['La cadena dimensional cierra sin cotas inventadas', 'La apertura visible se distingue del diámetro total'],
    risks: ['Pinzamiento', 'Juego radial', 'Cota de proveedor ambigua'],
    technicalWplRelation: 'Comparar envolventes CAD y registrar margen verificable.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-gap.hand-holes-fit', status: 'gap', title: 'Agujeros, tubos y ajuste de agujas',
    observableObjective: 'Relacionar agujeros y tubos de agujas con cañón de minutos, rueda de horas y eje de segundos aplicables.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Especificación oficial de alturas y diámetros del movimiento', 'Ficha del juego de agujas'],
    requiredVisual: 'Sección ampliada del ajuste y tabla de correspondencias con tolerancias verificadas.',
    proposedPractice: 'Rechazar un juego incompatible y documentar qué medida o tolerancia falta.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.2'],
    acceptanceCriteria: ['Cada interfaz se vincula a una cota oficial', 'No se asume que diámetro nominal equivale a ajuste válido'],
    risks: ['Deformación de tubo', 'Aguja suelta', 'Daño de pivote'],
    technicalWplRelation: 'Vincular especificaciones del movimiento y componentes externos al dossier.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-gap.hour-wheel-stack', status: 'gap', title: 'Rueda de horas dentro del apilamiento axial',
    observableObjective: 'Explicar y comprobar el apilamiento de rueda de horas, esfera y agujas a través de todo su recorrido.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Sección oficial del movimiento', 'Alturas de agujas y esfera del fabricante'],
    requiredVisual: 'Sección axial parametrizada con tolerancias, juego y barridos.',
    proposedPractice: 'Detectar pérdida de engrane o interferencia al variar el espesor de esfera dentro de datos permitidos.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.2'],
    acceptanceCriteria: ['Se conserva engrane y libertad en todos los estados', 'Los márgenes se calculan solo con datos aplicables'],
    risks: ['Desengrane', 'Roce entre agujas', 'Carga axial indebida'],
    technicalWplRelation: 'Usar el motor de interferencias del proyecto técnico cuando exista, sin crear un laboratorio nuevo.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-gap.caseback-clearance', status: 'gap', title: 'Fondo y holgura posterior',
    observableObjective: 'Verificar la envolvente posterior del movimiento, rotor y fijación frente al fondo en estados estáticos y dinámicos.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Plano de caja y fondo', 'Envolvente oficial del movimiento y rotor'],
    requiredVisual: 'Sección axial con barrido de rotor y compresión de junta.',
    proposedPractice: 'Comparar dos fondos y justificar cuál conserva holgura y cierre.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.2'],
    acceptanceCriteria: ['Holgura mínima documentada o marcada pendiente', 'El barrido del rotor no interfiere'],
    risks: ['Contacto del rotor', 'Cierre incompleto', 'Compresión incorrecta de junta'],
    technicalWplRelation: 'Consultar envolventes y barridos del ensamblaje técnico.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-gap.dynamic-interferences', status: 'gap', title: 'Interferencias estáticas y durante barridos',
    observableObjective: 'Comprobar interferencias de agujas, corona, tija, rotor y exterior en todos los estados relevantes.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Planos de todos los componentes elegidos', 'Tolerancias y estados de uso del fabricante'],
    requiredVisual: 'Mapa de interferencias por estado con barridos y secciones seleccionables.',
    proposedPractice: 'Ejecutar una lista de estados y registrar cada interferencia con componente, momento y autoridad.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.3'],
    acceptanceCriteria: ['Todos los estados declarados se revisan', 'Cada hallazgo incluye reproducción y decisión'],
    risks: ['Falso negativo por estado omitido', 'Geometría aproximada tratada como oficial'],
    technicalWplRelation: 'Reutilizar comprobaciones de ensamblaje del WPL técnico, no crear simulación paralela.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-gap.final-assembly-verification', status: 'gap', title: 'Orden y verificación del montaje final',
    observableObjective: 'Construir una secuencia de montaje final con puntos de control, reversibilidad y criterios de liberación.',
    primarySourceIds: COMMON_SOURCES, officialDocumentationNeeded: ['Instrucciones del fabricante de movimiento y componentes', 'Procedimiento moderno de hermeticidad y seguridad aplicable'],
    requiredVisual: 'Árbol de dependencias de montaje con checkpoints y estados de bloqueo.',
    proposedPractice: 'Ordenar el montaje, ubicar verificaciones y detener la liberación ante un hallazgo crítico.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.4'],
    acceptanceCriteria: ['Cada paso tiene prerrequisito y verificación', 'La liberación exige cierre de hallazgos críticos'],
    risks: ['Daño por orden incorrecto', 'Hermeticidad no comprobada', 'Liberación sin revisión'],
    technicalWplRelation: 'Generar un dossier de verificación enlazado al proyecto, sin afirmar montaje físico.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-partial.external-dimensions', status: 'partial', title: 'Cerrar dimensiones exteriores aplicables',
    observableObjective: 'Consolidar diámetro, altura, envolventes y tolerancias oficiales del conjunto elegido.', primarySourceIds: COMMON_SOURCES,
    officialDocumentationNeeded: ['Planos oficiales de movimiento, caja, esfera, agujas y cristal'], requiredVisual: 'Stack dimensional trazable.',
    proposedPractice: 'Auditar cada cota del stack y señalar su fuente.', evidenceModalities: ['K', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.1'],
    acceptanceCriteria: ['Ninguna cota crítica carece de localizador'], risks: ['Cota aproximada tratada como tolerancia'], technicalWplRelation: 'Dossier dimensional del proyecto.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-partial.cannon-pinion', status: 'partial', title: 'Cañón de minutos como interfaz del conjunto',
    observableObjective: 'Relacionar ajuste, altura y función del cañón de minutos con esfera y agujas.', primarySourceIds: COMMON_SOURCES,
    officialDocumentationNeeded: ['Especificación oficial del movimiento y agujas'], requiredVisual: 'Sección axial de minutería y agujas.',
    proposedPractice: 'Revisar una cadena axial y localizar la cota que gobierna cada interfaz.', evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.2'],
    acceptanceCriteria: ['Función y cota se mantienen separadas'], risks: ['Transferir ajuste de otro calibre'], technicalWplRelation: 'Interfaz movimiento-esfera-agujas.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-partial.axial-stack', status: 'partial', title: 'Apilamiento axial verificable',
    observableObjective: 'Cerrar el stack axial completo con tolerancias y estados de movimiento.', primarySourceIds: COMMON_SOURCES,
    officialDocumentationNeeded: ['Secciones y alturas oficiales'], requiredVisual: 'Stack axial toleranciado.', proposedPractice: 'Comprobar márgenes nominales y extremos.',
    evidenceModalities: ['K', 'V', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.3'], acceptanceCriteria: ['Márgenes positivos en estados aplicables'],
    risks: ['Acumulación de tolerancias omitida'], technicalWplRelation: 'Análisis de stack del ensamblaje técnico.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-partial.water-resistance', status: 'partial', title: 'Hermeticidad como protocolo moderno',
    observableObjective: 'Distinguir diseño de rutas de fuga, preparación y prueba profesional aplicable.', primarySourceIds: ['source.institutional.awci.standards'],
    officialDocumentationNeeded: ['Especificación moderna de caja, juntas y ensayo'], requiredVisual: 'Mapa de sellos y rutas de fuga.', proposedPractice: 'Seleccionar un protocolo seguro y explicar sus límites.',
    evidenceModalities: ['K', 'R'], executionTier: 'professional-or-outsourced', prerequisiteChapterIds: ['chapter.5.4'], acceptanceCriteria: ['Protocolo moderno y límite de presión documentados'],
    risks: ['Daño por prueba inadecuada', 'Fuente histórica usada como norma vigente'], technicalWplRelation: 'Registrar resultado externo revisado en el dossier.', productionLessonId: null,
  },
  {
    blueprintRef: 'stage5-partial.donor-parts', status: 'partial', title: 'Piezas donantes en un reloj completo',
    observableObjective: 'Evaluar identidad, compatibilidad, estado, reversibilidad y procedencia de una pieza donante.', primarySourceIds: COMMON_SOURCES,
    officialDocumentationNeeded: ['Documentación oficial de ambos calibres o componentes'], requiredVisual: 'Matriz de equivalencia con desconocidos y diferencias.',
    proposedPractice: 'Aceptar, rechazar o posponer una pieza donante con evidencia trazable.', evidenceModalities: ['K', 'R'], executionTier: 'simulation', prerequisiteChapterIds: ['chapter.5.4'],
    acceptanceCriteria: ['La similitud visual no se trata como compatibilidad', 'La procedencia queda registrada'], risks: ['Generalización entre calibres', 'Pérdida de originalidad'],
    technicalWplRelation: 'Vincular alternativas de componente al proyecto sin sustituir la geometría aprobada.', productionLessonId: null,
  },
] as const
