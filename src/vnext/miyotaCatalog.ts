import type { SourceReference } from './model'

export type MiyotaStudyTemplateId =
  | 'miyota-2035'
  | 'miyota-2036'
  | 'miyota-8215-study'
  | 'miyota-9015-study'

export interface OfficialMovementDocumentSet {
  specification?: string
  drawing?: string
  instruction?: string
  partsList?: string
}

export interface OfficialMovementReference {
  calibre: '2035' | '2036' | '8215' | '9015'
  family: 'Standard' | 'Standard Automatic' | 'Premium Automatic'
  mechanism: 'quartz' | 'mechanical'
  sizeLabel: string
  diameterMm?: number
  widthMm?: number
  lengthMm?: number
  heightMm: number
  accuracy: string
  functions: string[]
  runningTimeHours?: number
  frequencyVph?: number
  jewels?: number
  liftAngleDeg?: number
  clearanceMm?: { movementToCase: number; handToCase: number }
  productUrl: string
  documents: OfficialMovementDocumentSet
  studyTemplateId: MiyotaStudyTemplateId
  verifiedAt: string
}

const product = (calibre: string) => `https://miyotamovement.com/product/${calibre}/`

/**
 * Curated, traceable entry points into MIYOTA's official catalogue.
 *
 * These values are deliberately limited to facts present on the official product/specification
 * sheets. Detailed donor compatibility remains unknown until the real parts are measured.
 */
export const MIYOTA_OFFICIAL_MOVEMENTS: OfficialMovementReference[] = [
  {
    calibre: '2035',
    family: 'Standard',
    mechanism: 'quartz',
    sizeLabel: "6 3/4 x 8'''",
    widthMm: 15.3,
    lengthMm: 18.5,
    heightMm: 3.15,
    accuracy: '+/-20 s/mes',
    functions: ['3 agujas', 'deteccion de golpes'],
    clearanceMm: { movementToCase: 0.15, handToCase: 0.3 },
    productUrl: product('2035'),
    documents: {
      specification: 'https://miyotamovement.com/uploads/product/product_pgSIG6yWb0akqcUhDf.pdf',
      drawing: 'https://miyotamovement.com/uploads/product/product_4tdsbpNVQi1WcE5lUw.pdf',
      instruction: 'https://miyotamovement.com/uploads/product/product_cKAJDxu3CLoa18GHXO.pdf',
      partsList: 'https://miyotamovement.com/uploads/product/product_j6P3s1O5naNRxHZWMK.pdf',
    },
    studyTemplateId: 'miyota-2035',
    verifiedAt: '2026-07-15',
  },
  {
    calibre: '2036',
    family: 'Standard',
    mechanism: 'quartz',
    sizeLabel: "6 3/4 x 8'''",
    widthMm: 15.3,
    lengthMm: 18.5,
    heightMm: 3.15,
    accuracy: '+/-20 s/mes',
    functions: ['3 agujas', 'canones altos', 'deteccion de golpes'],
    productUrl: product('2036'),
    documents: {},
    studyTemplateId: 'miyota-2036',
    verifiedAt: '2026-07-15',
  },
  {
    calibre: '8215',
    family: 'Standard Automatic',
    mechanism: 'mechanical',
    sizeLabel: "11 1/2'''",
    diameterMm: 26,
    heightMm: 5.67,
    accuracy: '-20/+40 s/dia',
    functions: ['automatico', 'remonte manual', 'fecha rapida', '3 agujas', 'parada de segundero'],
    runningTimeHours: 42,
    frequencyVph: 21600,
    jewels: 21,
    liftAngleDeg: 49,
    clearanceMm: { movementToCase: 0.25, handToCase: 0.45 },
    productUrl: product('8215'),
    documents: {
      specification: 'https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf',
      drawing: 'https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf',
      instruction: 'https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf',
      partsList: 'https://miyotamovement.com/uploads/product/product_x2MOZCosd7iH59wu0K.pdf',
    },
    studyTemplateId: 'miyota-8215-study',
    verifiedAt: '2026-07-15',
  },
  {
    calibre: '9015',
    family: 'Premium Automatic',
    mechanism: 'mechanical',
    sizeLabel: "11 1/2'''",
    diameterMm: 26,
    heightMm: 3.9,
    accuracy: '-10/+30 s/dia',
    functions: ['automatico', 'remonte manual', 'fecha rapida', '3 agujas', 'parada de segundero'],
    runningTimeHours: 42,
    frequencyVph: 28800,
    jewels: 24,
    liftAngleDeg: 51,
    clearanceMm: { movementToCase: 0.4, handToCase: 0.4 },
    productUrl: product('9015'),
    documents: {
      specification: 'https://miyotamovement.com/uploads/product/product_7ev6UD3QZ0FwfgH1kJ.pdf',
      drawing: 'https://miyotamovement.com/uploads/product/product_GRZasplzcESHFnDKI0.pdf',
      instruction: 'https://miyotamovement.com/uploads/product/product_FWsxjrpEVoRi25QbNv.pdf',
      partsList: 'https://miyotamovement.com/uploads/product/product_9EVrfjw2zPWGxAy3qi.pdf',
    },
    studyTemplateId: 'miyota-9015-study',
    verifiedAt: '2026-07-15',
  },
]

export function miyotaMovement(calibre: OfficialMovementReference['calibre']): OfficialMovementReference {
  const reference = MIYOTA_OFFICIAL_MOVEMENTS.find((item) => item.calibre === calibre)
  if (!reference) throw new Error(`No existe una referencia oficial curada para MIYOTA ${calibre}.`)
  return reference
}

export function miyotaSourceReferences(reference: OfficialMovementReference): SourceReference[] {
  const sources: SourceReference[] = [
    {
      id: `miyota-${reference.calibre}-product`,
      title: `MIYOTA ${reference.calibre} · pagina oficial`,
      locator: reference.productUrl,
      retrievedAt: reference.verifiedAt,
    },
  ]
  for (const [kind, locator] of Object.entries(reference.documents)) {
    if (!locator) continue
    sources.push({
      id: `miyota-${reference.calibre}-${kind}`,
      title: `MIYOTA ${reference.calibre} · ${kind}`,
      locator,
      retrievedAt: reference.verifiedAt,
    })
  }
  return sources
}
