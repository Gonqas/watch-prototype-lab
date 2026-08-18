import type {
  AssemblyPlanStep,
  CompatibilityResult,
  ComponentModificationStatus,
  DataAuthority,
  DimensionalChain,
  DimensionUnit,
  DimensionVerificationStatus,
  IntegrationComponentCategory,
  IntegrationDocument,
  IntegrationProjectStatus,
  InterferenceCheck,
  WatchRequirement,
} from '../academy/reader/personal/phase014k'

const PROJECT_STATUS_LABELS = {
  draft: 'Borrador',
  'source-needed': 'Falta documentación aplicable',
  'measurement-needed': 'Falta una medición',
  'conflict-found': 'Conflicto encontrado',
  'documentally-compatible': 'Compatible documentalmente',
  'physical-validation-pending': 'Validación física pendiente',
  rejected: 'Rechazado',
} satisfies Record<IntegrationProjectStatus, string>

const COMPONENT_LABELS = {
  movement: 'Movimiento', case: 'Caja', 'movement-holder': 'Aro portamovimiento', stem: 'Tija', crown: 'Corona', tube: 'Tubo', dial: 'Esfera',
  'hand-hour': 'Aguja de horas', 'hand-minute': 'Aguja de minutos', 'hand-second': 'Aguja de segundos', crystal: 'Cristal', bezel: 'Bisel',
  rehaut: 'Realce interior', caseback: 'Fondo', gasket: 'Junta', 'donor-part': 'Pieza donante', other: 'Componente receptor',
} satisfies Record<IntegrationComponentCategory, string>

const AUTHORITY_LABELS = {
  'official-manufacturer': 'Documentación oficial del fabricante',
  'official-component-supplier': 'Documentación oficial del proveedor del componente',
  'manufacturer-drawing': 'Plano del fabricante',
  'supplier-technical-sheet': 'Ficha técnica del proveedor',
  'measured-own-component': 'Medición del componente propio',
  'derived-from-verified-inputs': 'Derivado de datos verificados',
  'secondary-reference': 'Referencia secundaria',
  estimated: 'Estimación declarada',
  'visual-match-only': 'Solo coincidencia visual',
  unknown: 'Autoridad pendiente',
} satisfies Record<DataAuthority, string>

const MODIFICATION_STATUS_LABELS = {
  unmodified: 'Sin modificar',
  'modification-planned': 'Modificación planificada',
  'modified-externally': 'Modificado fuera de la aplicación',
  unknown: 'Estado pendiente',
} satisfies Record<ComponentModificationStatus, string>

const DOCUMENT_STATUS_LABELS = {
  verified: 'Verificado',
  'source-limited': 'Limitado por la fuente disponible',
  unverified: 'No verificado',
} satisfies Record<IntegrationDocument['verificationStatus'], string>

const DIMENSION_STATUS_LABELS = {
  'verified-primary': 'Verificado en una fuente primaria',
  'visually-verified': 'Verificado visualmente',
  measured: 'Medido',
  derived: 'Derivado de datos verificados',
  estimated: 'Estimado',
  unknown: 'Pendiente',
} satisfies Record<DimensionVerificationStatus, string>

const REQUIREMENT_PRIORITY_LABELS = {
  must: 'Imprescindible', should: 'Recomendable', could: 'Opcional',
} satisfies Record<WatchRequirement['priority'], string>

const REQUIREMENT_STATUS_LABELS = {
  draft: 'Borrador', verifiable: 'Verificable', unknown: 'Dato pendiente',
} satisfies Record<WatchRequirement['status'], string>

const COMPATIBILITY_RESULT_LABELS = {
  'not-evaluated': 'No evaluada',
  'source-needed': 'Falta documentación aplicable',
  'measurement-needed': 'Falta una medición',
  'compatible-on-paper': 'Compatible documentalmente',
  incompatible: 'Incompatible',
  conditional: 'Compatible con condiciones',
  'physical-validation-pending': 'Validación física pendiente',
} satisfies Record<CompatibilityResult, string>

const CHAIN_STATUS_LABELS = {
  'not-evaluated': 'No evaluada', unknown: 'Datos pendientes', calculated: 'Calculada', 'conflict-found': 'Conflicto encontrado',
  'datum-conflict': 'Conflicto entre referencias geométricas',
} satisfies Record<DimensionalChain['status'], string>

const INTERFERENCE_RESULT_LABELS = {
  'input-incomplete': 'Entradas incompletas',
  'conflict-detected': 'Conflicto detectado',
  'no-conflict-in-represented-model': 'Sin conflicto en el modelo representado',
  'physical-validation-pending': 'Validación física pendiente',
} satisfies Record<InterferenceCheck['result'], string>

const EXECUTION_STATUS_LABELS = {
  'planned-only': 'Solo planificado',
  'physical-validation-pending': 'Validación física pendiente',
} satisfies Record<AssemblyPlanStep['executionStatus'], string>

const DIMENSION_UNIT_LABELS = {
  mm: 'mm', deg: '°', count: 'unidades', unknown: 'unidad pendiente',
} satisfies Record<DimensionUnit, string>

const DOSSIER_COVERAGE_LABELS = {
  present: 'Con contenido', empty: 'Vacío', pending: 'Pendiente',
} as const

const SELF_REVIEW_LABELS: Record<string, string> = {
  'entiendo-la-matriz': 'Entiendo cómo se lee la matriz de compatibilidad',
  'entiendo-los-datums': 'Entiendo cómo se fijan las referencias geométricas',
  'entiendo-la-cadena-radial': 'Entiendo cómo se construye la cadena radial',
  'entiendo-la-cadena-axial': 'Entiendo cómo se construye la cadena axial',
  'entiendo-los-unknowns': 'Sé conservar y resolver los datos pendientes',
  'entiendo-la-validacion-pendiente': 'Distingo el análisis documental de la validación física',
}

const REQUIRED_DATA_LABELS: Record<string, string> = {
  'movement-envelope': 'envolvente del movimiento', 'case-cavity': 'cavidad de la caja', 'axial-support': 'apoyo axial',
  'movement-diameter': 'diámetro del movimiento', 'holder-inner-diameter': 'diámetro interior del aro',
  'holder-outer-diameter': 'diámetro exterior del aro', 'case-seat-diameter': 'diámetro del asiento de caja', 'anti-rotation': 'sistema antirrotación',
  'stem-reference': 'referencia de la tija', 'movement-stem-interface': 'interfaz de tija del movimiento', 'stem-thread': 'rosca de la tija',
  'crown-thread': 'rosca de la corona', 'functional-length': 'longitud funcional', 'crown-interface': 'interfaz de la corona',
  'tube-interface': 'interfaz del tubo', 'travel-states': 'estados del recorrido', 'tube-seat': 'asiento del tubo',
  'case-tube-seat': 'asiento del tubo en la caja', 'axis-height': 'altura del eje', 'dial-thickness': 'espesor de la esfera',
  'movement-dial-support': 'apoyo de esfera del movimiento', 'date-aperture': 'ventana de fecha', 'dial-total-diameter': 'diámetro total de la esfera',
  'case-dial-seat': 'asiento de esfera en la caja', 'visible-opening': 'apertura visible', 'foot-count': 'cantidad de pies',
  'foot-radius': 'radio de los pies', 'foot-angles': 'ángulos de los pies', 'movement-foot-holes': 'agujeros para pies en el movimiento',
  'post-diameters': 'diámetros de los postes', 'hand-hole-diameters': 'diámetros de los agujeros de las agujas', 'tube-lengths': 'longitudes de los tubos',
  'hour-wheel-height': 'altura de la rueda de horas', 'dial-gap': 'holgura de la esfera', 'hour-hand-height': 'altura de la aguja de horas',
  'dial-surface-height': 'altura de la superficie de la esfera', 'index-height': 'altura de los índices', 'hour-hand-envelope': 'envolvente de la aguja de horas',
  'minute-hand-envelope': 'envolvente de la aguja de minutos', 'second-hand-envelope': 'envolvente de la aguja de segundos',
  'hand-stack-top': 'altura superior del apilado de agujas', 'crystal-inner-height': 'altura interior del cristal', 'rehaut-envelope': 'envolvente del realce interior',
  'rotor-envelope': 'envolvente del rotor', 'caseback-inner-height': 'altura interior del fondo', 'gasket-stack': 'apilado de la junta',
  'crystal-seat': 'asiento del cristal', 'bezel-seat': 'asiento del bisel', 'retention-method': 'método de retención',
  'gasket-section': 'sección de la junta', 'housing-section': 'sección del alojamiento', 'supplier-fit': 'ajuste declarado por el proveedor',
  'donor-identity': 'identidad del donante', 'receiver-identity': 'identidad del receptor', 'applicable-interfaces': 'interfaces aplicables',
}

export const academyStage5ProjectStatusLabel = (value: IntegrationProjectStatus): string => PROJECT_STATUS_LABELS[value]
export const academyStage5ComponentLabel = (value: IntegrationComponentCategory | string): string => {
  const category = value.replace(/^component\./u, '') as IntegrationComponentCategory
  return COMPONENT_LABELS[category] ?? 'Componente'
}
export const academyStage5AuthorityLabel = (value: DataAuthority): string => AUTHORITY_LABELS[value]
export const academyStage5ModificationStatusLabel = (value: ComponentModificationStatus): string => MODIFICATION_STATUS_LABELS[value]
export const academyStage5DocumentStatusLabel = (value: IntegrationDocument['verificationStatus']): string => DOCUMENT_STATUS_LABELS[value]
export const academyStage5DimensionStatusLabel = (value: DimensionVerificationStatus): string => DIMENSION_STATUS_LABELS[value]
export const academyStage5RequirementPriorityLabel = (value: WatchRequirement['priority']): string => REQUIREMENT_PRIORITY_LABELS[value]
export const academyStage5RequirementStatusLabel = (value: WatchRequirement['status']): string => REQUIREMENT_STATUS_LABELS[value]
export const academyStage5CompatibilityResultLabel = (value: CompatibilityResult): string => COMPATIBILITY_RESULT_LABELS[value]
export const academyStage5ChainStatusLabel = (value: DimensionalChain['status']): string => CHAIN_STATUS_LABELS[value]
export const academyStage5InterferenceResultLabel = (value: InterferenceCheck['result']): string => INTERFERENCE_RESULT_LABELS[value]
export const academyStage5ExecutionStatusLabel = (value: AssemblyPlanStep['executionStatus']): string => EXECUTION_STATUS_LABELS[value]
export const academyStage5DimensionUnitLabel = (value: DimensionUnit): string => DIMENSION_UNIT_LABELS[value]
export const academyStage5DossierCoverageLabel = (value: keyof typeof DOSSIER_COVERAGE_LABELS): string => DOSSIER_COVERAGE_LABELS[value]
export const academyStage5SelfReviewLabel = (value: string): string => SELF_REVIEW_LABELS[value] ?? 'Revisar este punto del método'
export const academyStage5RequiredDataLabel = (value: string): string => REQUIRED_DATA_LABELS[value] ?? 'Dato requerido por documentar'

export const ACADEMY_STAGE_5_UI_LABEL_SETS = {
  projectStatuses: PROJECT_STATUS_LABELS,
  components: COMPONENT_LABELS,
  authorities: AUTHORITY_LABELS,
  modificationStatuses: MODIFICATION_STATUS_LABELS,
  documentStatuses: DOCUMENT_STATUS_LABELS,
  dimensionStatuses: DIMENSION_STATUS_LABELS,
  requirementPriorities: REQUIREMENT_PRIORITY_LABELS,
  requirementStatuses: REQUIREMENT_STATUS_LABELS,
  compatibilityResults: COMPATIBILITY_RESULT_LABELS,
  chainStatuses: CHAIN_STATUS_LABELS,
  interferenceResults: INTERFERENCE_RESULT_LABELS,
  executionStatuses: EXECUTION_STATUS_LABELS,
  dimensionUnits: DIMENSION_UNIT_LABELS,
  dossierCoverage: DOSSIER_COVERAGE_LABELS,
  selfReview: SELF_REVIEW_LABELS,
  requiredData: REQUIRED_DATA_LABELS,
} as const
