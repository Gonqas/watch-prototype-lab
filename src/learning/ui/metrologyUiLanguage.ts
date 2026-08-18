import type {
  ComparisonInterpretation,
  ComponentCorrespondence,
  FindingCategory,
  FindingSeverity,
  FindingType,
  GeometryProposalStatus,
  ImageAnnotation,
  ImageAnnotationKind,
  InspectionFinding,
  InstrumentProfile,
  InstrumentVerificationKind,
  InstrumentVerificationStatus,
  MeasurementSeries,
  PhysicalSpecimen,
} from '../../core/horology-metrology'

const SPECIMEN_CONDITION_LABELS = {
  'as-received': 'Tal como se recibió', disassembled: 'Desmontada', 'partially-assembled': 'Parcialmente montada', assembled: 'Montada', unknown: 'Estado pendiente',
} satisfies Record<PhysicalSpecimen['condition'], string>

const CORRESPONDENCE_LABELS = {
  confirmed: 'Confirmada', probable: 'Probable', possible: 'Posible', unknown: 'Sin correspondencia asignada', 'not-mappable': 'No se puede relacionar',
} satisfies Record<ComponentCorrespondence, string>

const INSTRUMENT_TYPE_LABELS = {
  caliper: 'Calibre', micrometer: 'Micrómetro', indicator: 'Comparador', comparator: 'Comparador de banco', scale: 'Báscula',
  'optical-microscope': 'Microscopio óptico', camera: 'Cámara', 'timing-machine': 'Cronocomparador', custom: 'Otro instrumento',
} satisfies Record<InstrumentProfile['type'], string>

const VERIFICATION_KIND_LABELS = {
  'zero-check': 'Comprobación de cero', 'reference-check': 'Comprobación con referencia', 'calibration-certificate': 'Certificado de calibración',
  comparison: 'Comparación', 'functional-check': 'Comprobación funcional',
} satisfies Record<InstrumentVerificationKind, string>

const VERIFICATION_STATUS_LABELS = {
  valid: 'Vigente', expired: 'Caducada', failed: 'No superada', limited: 'Limitada', unknown: 'Estado pendiente',
} satisfies Record<InstrumentVerificationStatus, string>

const FINDING_CATEGORY_LABELS = {
  contamination: 'Contaminación', surface: 'Superficie', geometry: 'Geometría', supports: 'Apoyos', flexible: 'Elementos flexibles', mounting: 'Montaje',
} satisfies Record<FindingCategory, string>

const FINDING_TYPE_LABELS = {
  dust: 'Polvo', fiber: 'Fibra', residue: 'Residuo', 'visible-oil': 'Aceite visible', 'visible-grease': 'Grasa visible', stain: 'Mancha', 'metal-particle': 'Partícula metálica',
  scratch: 'Arañazo', mark: 'Marca', burr: 'Rebaba', dent: 'Abolladura', discoloration: 'Cambio de color', oxidation: 'Oxidación', corrosion: 'Corrosión', 'finish-loss': 'Pérdida de acabado',
  deformation: 'Deformación', 'bent-part': 'Pieza doblada', 'apparent-eccentricity': 'Excentricidad aparente', 'apparent-flatness': 'Falta de planitud aparente',
  'missing-tooth': 'Diente ausente', 'damaged-tooth': 'Diente dañado', 'deformed-hole': 'Agujero deformado', 'damaged-pivot': 'Pivote dañado', 'bent-pivot': 'Pivote doblado',
  'fractured-jewel': 'Rubí fracturado', 'missing-jewel': 'Rubí ausente', 'damaged-seat': 'Asiento dañado', 'misaligned-support': 'Apoyo desalineado',
  'deformed-spring': 'Muelle deformado', 'off-center-hairspring': 'Espiral descentrada', 'displaced-contact': 'Contacto desplazado', 'missing-spring': 'Muelle ausente',
  'incorrect-hooking': 'Enganche incorrecto', 'incorrect-screw': 'Tornillo incorrecto', 'missing-screw': 'Tornillo ausente', 'inverted-part': 'Pieza invertida',
  'unseated-part': 'Pieza sin asentar', 'unseated-bridge': 'Puente sin asentar', 'unknown-orientation': 'Orientación pendiente de confirmar',
} satisfies Record<FindingType, string>

const FINDING_SEVERITY_LABELS = {
  note: 'Observación', minor: 'Leve', significant: 'Significativo', 'critical-unknown': 'Posible criticidad pendiente de confirmar',
} satisfies Record<FindingSeverity, string>

const CONFIDENCE_LABELS = {
  high: 'Alta', medium: 'Media', low: 'Baja', unknown: 'Pendiente',
} satisfies Record<InspectionFinding['confidence'], string>

const SERIES_STATUS_LABELS = {
  draft: 'Borrador', complete: 'Completa', invalidated: 'Invalidada',
} satisfies Record<MeasurementSeries['status'], string>

const COMPARISON_LABELS = {
  'compatible-with-nominal': 'Compatible con el valor nominal',
  'within-declared-uncertainty': 'Dentro de la incertidumbre declarada',
  'apparent-discrepancy': 'Discrepancia aparente',
  'comparison-invalid': 'Comparación no válida',
  'tolerance-unknown': 'Tolerancia pendiente',
  'nominal-missing': 'Falta el valor nominal',
  'measurement-insufficient': 'Medición insuficiente',
  'different-reference-frame': 'Referencias geométricas incompatibles',
} satisfies Record<ComparisonInterpretation, string>

const PROPOSAL_STATUS_LABELS = {
  draft: 'Borrador', 'needs-more-evidence': 'Necesita más evidencia', 'ready-for-review': 'Lista para revisar', approved: 'Aprobada', rejected: 'Rechazada',
  superseded: 'Sustituida', implemented: 'Implementada', validated: 'Validada',
} satisfies Record<GeometryProposalStatus, string>

const ANNOTATION_KIND_LABELS = {
  distance: 'Distancia', 'diameter-circle': 'Diámetro por círculo', 'diameter-three-point': 'Diámetro por tres puntos', radius: 'Radio', angle: 'Ángulo',
  center: 'Centro', area: 'Área aproximada', 'tooth-count': 'Conteo manual de dientes', marker: 'Marcador', label: 'Etiqueta', region: 'Región',
} satisfies Record<ImageAnnotationKind, string>

const ANNOTATION_UNIT_LABELS: Record<NonNullable<ImageAnnotation['unit']>, string> = {
  px: 'px', px2: 'px²', mm: 'mm', um: 'µm', deg: '°', mm2: 'mm²', um2: 'µm²', count: 'unidades',
}

export const metrologySpecimenConditionLabel = (value: PhysicalSpecimen['condition']): string => SPECIMEN_CONDITION_LABELS[value]
export const metrologyCorrespondenceLabel = (value: ComponentCorrespondence): string => CORRESPONDENCE_LABELS[value]
export const metrologyInstrumentTypeLabel = (value: InstrumentProfile['type']): string => INSTRUMENT_TYPE_LABELS[value]
export const metrologyVerificationKindLabel = (value: InstrumentVerificationKind): string => VERIFICATION_KIND_LABELS[value]
export const metrologyVerificationStatusLabel = (value: InstrumentVerificationStatus): string => VERIFICATION_STATUS_LABELS[value]
export const metrologyFindingCategoryLabel = (value: FindingCategory): string => FINDING_CATEGORY_LABELS[value]
export const metrologyFindingTypeLabel = (value: FindingType): string => FINDING_TYPE_LABELS[value]
export const metrologyFindingSeverityLabel = (value: FindingSeverity): string => FINDING_SEVERITY_LABELS[value]
export const metrologyConfidenceLabel = (value: InspectionFinding['confidence']): string => CONFIDENCE_LABELS[value]
export const metrologySeriesStatusLabel = (value: MeasurementSeries['status']): string => SERIES_STATUS_LABELS[value]
export const metrologyComparisonLabel = (value: ComparisonInterpretation): string => COMPARISON_LABELS[value]
export const metrologyProposalStatusLabel = (value: GeometryProposalStatus): string => PROPOSAL_STATUS_LABELS[value]
export const metrologyAnnotationKindLabel = (value: ImageAnnotationKind): string => ANNOTATION_KIND_LABELS[value]
export const metrologyAnnotationUnitLabel = (value: ImageAnnotation['unit']): string => value ? ANNOTATION_UNIT_LABELS[value] : ''
export const metrologyAnnotationMethodLabel = (value: string): string => ({
  'known-distance': 'distancia física conocida',
  'scale-bar': 'barra de escala',
  'calibration-target': 'patrón de calibración',
}[value] ?? value)
export const metrologyTargetParameterLabel = (value: string): string => ({
  'dimension.pending-selection': 'Parámetro dimensional pendiente de seleccionar',
}[value] ?? 'Parámetro documentado del modelo')

export const METROLOGY_UI_LABEL_SETS = {
  specimenConditions: SPECIMEN_CONDITION_LABELS,
  correspondence: CORRESPONDENCE_LABELS,
  instrumentTypes: INSTRUMENT_TYPE_LABELS,
  verificationKinds: VERIFICATION_KIND_LABELS,
  verificationStatuses: VERIFICATION_STATUS_LABELS,
  findingCategories: FINDING_CATEGORY_LABELS,
  findingTypes: FINDING_TYPE_LABELS,
  findingSeverities: FINDING_SEVERITY_LABELS,
  confidences: CONFIDENCE_LABELS,
  seriesStatuses: SERIES_STATUS_LABELS,
  comparisons: COMPARISON_LABELS,
  proposalStatuses: PROPOSAL_STATUS_LABELS,
  annotationKinds: ANNOTATION_KIND_LABELS,
  annotationUnits: ANNOTATION_UNIT_LABELS,
} as const
