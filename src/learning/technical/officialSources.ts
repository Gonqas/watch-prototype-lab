import { z } from 'zod'
import { stableFingerprint } from '../identity'
import { SourceCitationSchema, type SourceCitation } from '../sources'

const sourceId = z.string().regex(/^source\.[a-z0-9][a-z0-9.-]{2,159}$/)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const isoDateTime = z.string().datetime({ offset: true })
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

export const OfficialSourceRightsSchema = z.object({
  license: z.literal('unknown'),
  redistribution: z.literal('requires-review'),
  repositoryStorage: z.literal('prohibited-until-reviewed'),
  verificationCache: z.literal('private-local-only'),
}).strict()
export type OfficialSourceRights = z.infer<typeof OfficialSourceRightsSchema>

export const OfficialRemoteIntegritySchema = z.object({
  hashMode: z.enum(['raw-response-body', 'html-csrf-normalized']),
  verifiedAt: isoDateTime,
  finalUrl: z.string().url().refine((value) => {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'miyotamovement.com'
  }, 'La URL final debe permanecer en el origen oficial HTTPS.'),
  mediaType: z.enum(['text/html', 'application/pdf']),
  sizeBytes: z.number().int().positive().max(30 * 1024 * 1024),
  sha256,
}).strict()
export type OfficialRemoteIntegrity = z.infer<typeof OfficialRemoteIntegritySchema>

export const OfficialRemoteObservationSchema = z.object({
  hashMode: z.enum(['raw-response-body', 'html-csrf-normalized']),
  verifiedAt: isoDateTime,
  requestedUrl: z.string().url(),
  finalUrl: z.string().url(),
  mediaType: z.string().min(1).max(200),
  sizeBytes: z.number().int().nonnegative(),
  sha256,
  etag: z.string().min(1).max(500).optional(),
  lastModified: z.string().min(1).max(500).optional(),
}).strict()
export type OfficialRemoteObservation = z.infer<typeof OfficialRemoteObservationSchema>

export const OfficialDocumentRecordSchema = z.object({
  id: sourceId,
  manufacturer: z.literal('MIYOTA'),
  calibre: z.string().min(1).max(80),
  documentType: z.enum(['product-page', 'specification', 'drawing', 'instruction-manual', 'parts-list-exploded-view']),
  title: z.string().min(1).max(240),
  url: z.string().url().refine((value) => new URL(value).hostname === 'miyotamovement.com', 'La fuente debe pertenecer al dominio oficial miyotamovement.com.'),
  revision: z.string().min(1).max(240),
  retrievedAt: isoDate,
  rights: OfficialSourceRightsSchema,
  remoteIntegrity: OfficialRemoteIntegritySchema.optional(),
  localCopy: z.discriminatedUnion('stored', [
    z.object({ stored: z.literal(false) }).strict(),
    z.object({
      stored: z.literal(true),
      path: z.string().min(1).max(500),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }).strict(),
  ]),
}).strict()
export type OfficialDocumentRecord = z.infer<typeof OfficialDocumentRecordSchema>

export const OfficialFactRecordSchema = z.object({
  id: z.string().regex(/^fact\.[a-z0-9][a-z0-9.-]{2,199}$/),
  label: z.string().min(1).max(240),
  value: z.union([z.number().finite(), z.string().min(1).max(500), z.array(z.string().min(1).max(240)).min(1)]),
  unit: z.enum(['mm', 'seconds-per-month', 'seconds-per-day', 'years', 'hours', 'vph', 'count', 'degrees', 'ligne', 'text']),
  sourceIds: z.array(sourceId).min(1),
}).strict()
export type OfficialFactRecord = z.infer<typeof OfficialFactRecordSchema>

export const OfficialCalibreRegistryEntrySchema = z.object({
  manufacturer: z.literal('MIYOTA'),
  calibre: z.string().min(1).max(80),
  family: z.string().min(1).max(120),
  mechanism: z.enum(['quartz', 'mechanical']),
  status: z.enum(['curated', 'planned']),
  verifiedAt: isoDate.optional(),
  documents: z.array(OfficialDocumentRecordSchema),
  facts: z.array(OfficialFactRecordSchema),
  limitations: z.array(z.string().min(1).max(1000)).default([]),
}).strict().superRefine((entry, context) => {
  if (entry.status === 'curated') {
    if (!entry.verifiedAt) context.addIssue({ code: 'custom', path: ['verifiedAt'], message: 'Un calibre curado necesita fecha de verificación.' })
    const types = new Set(entry.documents.map(({ documentType }) => documentType))
    for (const required of ['product-page', 'specification', 'drawing', 'instruction-manual', 'parts-list-exploded-view'] as const) {
      if (!types.has(required)) context.addIssue({ code: 'custom', path: ['documents'], message: `Falta el documento oficial ${required}.` })
    }
    const documentIds = new Set(entry.documents.map(({ id }) => id))
    for (const document of entry.documents) {
      if (!document.remoteIntegrity) {
        context.addIssue({ code: 'custom', path: ['documents'], message: `Falta huella remota curada para ${document.id}.` })
      } else {
        const expectedMediaType = document.documentType === 'product-page' ? 'text/html' : 'application/pdf'
        if (document.remoteIntegrity.mediaType !== expectedMediaType) {
          context.addIssue({ code: 'custom', path: ['documents'], message: `Tipo remoto incoherente para ${document.id}.` })
        }
      }
    }
    for (const fact of entry.facts) {
      for (const id of fact.sourceIds) {
        if (!documentIds.has(id)) context.addIssue({ code: 'custom', path: ['facts'], message: `El dato ${fact.id} referencia una fuente ajena al calibre: ${id}` })
      }
    }
  } else if (entry.documents.length > 0 || entry.facts.length > 0 || entry.verifiedAt) {
    context.addIssue({ code: 'custom', path: ['status'], message: 'Un calibre planned no puede parecer curado parcialmente.' })
  }
})
export type OfficialCalibreRegistryEntry = z.infer<typeof OfficialCalibreRegistryEntrySchema>

export const OfficialSourceRegistrySchema = z.object({
  schemaVersion: z.literal(2),
  registryId: z.literal('registry.miyota.official-sources'),
  revision: z.literal('0.2.0'),
  verificationScope: z.tuple([z.literal('2035'), z.literal('8215')]),
  integrityPolicy: z.object({
    onHashChange: z.literal('block-and-review'),
    onUrlChange: z.literal('new-record-or-reviewed-revision'),
    automaticBaselineUpdate: z.literal(false),
  }).strict(),
  entries: z.array(OfficialCalibreRegistryEntrySchema).min(2),
}).strict().superRefine((registry, context) => {
  const keys = registry.entries.map(({ manufacturer, calibre }) => `${manufacturer}:${calibre}`)
  if (new Set(keys).size !== keys.length) context.addIssue({ code: 'custom', path: ['entries'], message: 'El registro contiene calibres duplicados.' })
})
export type OfficialSourceRegistry = z.infer<typeof OfficialSourceRegistrySchema>

const consultedAt = '2026-07-28'
const noPublishedRevision = 'Sin identificador de revisión publicado; bytes remotos fijados el 2026-07-28.'

const remoteIntegrityByDocumentId: Readonly<Record<string, Omit<OfficialRemoteIntegrity, 'finalUrl'>>> = {
  'source.miyota.2035.product-page': {
    hashMode: 'html-csrf-normalized',
    verifiedAt: '2026-07-28T11:39:24.048Z',
    mediaType: 'text/html',
    sizeBytes: 48532,
    sha256: 'fe722a335daa118d55d5a8772a1a6976e4f4d89602db92afcabf9b8df6edac4a',
  },
  'source.miyota.2035.specification': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:18.006Z',
    mediaType: 'application/pdf',
    sizeBytes: 81827,
    sha256: 'f57a9cf11e8c93a20f7dd8b6dcb9315d404bab4ae014a90d3f80ec9839f7cf9e',
  },
  'source.miyota.2035.drawing': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:18.527Z',
    mediaType: 'application/pdf',
    sizeBytes: 134421,
    sha256: '60fe3a52b4457bbb213a1989b8891e8d9420d4debbf6837a046873312d823cea',
  },
  'source.miyota.2035.instruction-manual': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:18.793Z',
    mediaType: 'application/pdf',
    sizeBytes: 42370,
    sha256: '646812b5d9977904ec74f0733e1155e65b1218f796d0bf80fcf05b6cfd2af2c3',
  },
  'source.miyota.2035.parts-list-exploded-view': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:19.095Z',
    mediaType: 'application/pdf',
    sizeBytes: 15799,
    sha256: '8b7705b787c041d2f2224e8e1502f5c5f01a69b1dbddac42db44de74d2a7c4f7',
  },
  'source.miyota.8215.product-page': {
    hashMode: 'html-csrf-normalized',
    verifiedAt: '2026-07-28T11:39:24.367Z',
    mediaType: 'text/html',
    sizeBytes: 53456,
    sha256: '42abce52fa872351b448151ca7b79c0905b41ad33b2a0f2a2edef781686423db',
  },
  'source.miyota.8215.specification': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:19.665Z',
    mediaType: 'application/pdf',
    sizeBytes: 100856,
    sha256: 'bcb22d8e921b06165e67ffbbecfbcc444b8a67ccb4319d598c14bda6216418dc',
  },
  'source.miyota.8215.drawing': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:20.188Z',
    mediaType: 'application/pdf',
    sizeBytes: 263227,
    sha256: '95db183473b7372aad4f80665c23cdff32d5f64fdfe63b1cc3828811ef132c54',
  },
  'source.miyota.8215.instruction-manual': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:20.456Z',
    mediaType: 'application/pdf',
    sizeBytes: 44260,
    sha256: '6286b8431619f825b6bfd2715be78891dd2cd7ba3dfbead3959d570b08e2afb9',
  },
  'source.miyota.8215.parts-list-exploded-view': {
    hashMode: 'raw-response-body',
    verifiedAt: '2026-07-28T11:37:20.729Z',
    mediaType: 'application/pdf',
    sizeBytes: 16640,
    sha256: 'ea5f619949fba80737c7d0db6dbef128d302ec23625ec77aca25d5ee63012e0d',
  },
}

const document = (
  calibre: string,
  documentType: OfficialDocumentRecord['documentType'],
  title: string,
  url: string,
): OfficialDocumentRecord => OfficialDocumentRecordSchema.parse({
  id: `source.miyota.${calibre}.${documentType}`,
  manufacturer: 'MIYOTA',
  calibre,
  documentType,
  title,
  url,
  revision: noPublishedRevision,
  retrievedAt: consultedAt,
  rights: {
    license: 'unknown',
    redistribution: 'requires-review',
    repositoryStorage: 'prohibited-until-reviewed',
    verificationCache: 'private-local-only',
  },
  remoteIntegrity: {
    ...remoteIntegrityByDocumentId[`source.miyota.${calibre}.${documentType}`],
    finalUrl: url,
  },
  localCopy: { stored: false },
})

const documents2035 = [
  document('2035', 'product-page', 'MIYOTA 2035 · página oficial', 'https://miyotamovement.com/product/2035/'),
  document('2035', 'specification', 'MIYOTA 2035 · specification', 'https://miyotamovement.com/uploads/product/product_pgSIG6yWb0akqcUhDf.pdf'),
  document('2035', 'drawing', 'MIYOTA 2035 · drawing', 'https://miyotamovement.com/uploads/product/product_4tdsbpNVQi1WcE5lUw.pdf'),
  document('2035', 'instruction-manual', 'MIYOTA 2035 · instruction manual', 'https://miyotamovement.com/uploads/product/product_cKAJDxu3CLoa18GHXO.pdf'),
  document('2035', 'parts-list-exploded-view', 'MIYOTA 2035 · parts list and exploded view', 'https://miyotamovement.com/uploads/product/product_j6P3s1O5naNRxHZWMK.pdf'),
]

const documents8215 = [
  document('8215', 'product-page', 'MIYOTA 8215 · página oficial', 'https://miyotamovement.com/product/8215/'),
  document('8215', 'specification', 'MIYOTA 8215 · specification', 'https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf'),
  document('8215', 'drawing', 'MIYOTA 8215 · drawing', 'https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf'),
  document('8215', 'instruction-manual', 'MIYOTA 8215 · instruction manual', 'https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf'),
  document('8215', 'parts-list-exploded-view', 'MIYOTA 8215 · parts list and exploded view', 'https://miyotamovement.com/uploads/product/product_x2MOZCosd7iH59wu0K.pdf'),
]

const fact = (
  id: string,
  label: string,
  value: OfficialFactRecord['value'],
  unit: OfficialFactRecord['unit'],
  sourceIds: string[],
): OfficialFactRecord => OfficialFactRecordSchema.parse({ id, label, value, unit, sourceIds })

export const MIYOTA_2035_SOURCE_IDS = {
  product: 'source.miyota.2035.product-page',
  specification: 'source.miyota.2035.specification',
  drawing: 'source.miyota.2035.drawing',
  manual: 'source.miyota.2035.instruction-manual',
  parts: 'source.miyota.2035.parts-list-exploded-view',
} as const

export const MIYOTA_8215_SOURCE_IDS = {
  product: 'source.miyota.8215.product-page',
  specification: 'source.miyota.8215.specification',
  drawing: 'source.miyota.8215.drawing',
  manual: 'source.miyota.8215.instruction-manual',
  parts: 'source.miyota.8215.parts-list-exploded-view',
} as const

export const BLUEPRINT_SOURCE_ID = 'source.blueprint.sistema4b.v0.1'

export const MIYOTA_OFFICIAL_SOURCE_REGISTRY: OfficialSourceRegistry = OfficialSourceRegistrySchema.parse({
  schemaVersion: 2,
  registryId: 'registry.miyota.official-sources',
  revision: '0.2.0',
  verificationScope: ['2035', '8215'],
  integrityPolicy: {
    onHashChange: 'block-and-review',
    onUrlChange: 'new-record-or-reviewed-revision',
    automaticBaselineUpdate: false,
  },
  entries: [
    {
      manufacturer: 'MIYOTA',
      calibre: '2035',
      family: 'Standard',
      mechanism: 'quartz',
      status: 'curated',
      verifiedAt: consultedAt,
      documents: documents2035,
      facts: [
        fact('fact.miyota.2035.size', 'Tamaño', "6 3/4 × 8'''", 'ligne', [MIYOTA_2035_SOURCE_IDS.product, MIYOTA_2035_SOURCE_IDS.specification]),
        fact('fact.miyota.2035.width', 'Anchura nominal', 15.3, 'mm', [MIYOTA_2035_SOURCE_IDS.specification]),
        fact('fact.miyota.2035.length', 'Longitud nominal', 18.5, 'mm', [MIYOTA_2035_SOURCE_IDS.specification]),
        fact('fact.miyota.2035.height', 'Altura nominal', 3.15, 'mm', [MIYOTA_2035_SOURCE_IDS.product, MIYOTA_2035_SOURCE_IDS.specification]),
        fact('fact.miyota.2035.accuracy', 'Precisión nominal', 20, 'seconds-per-month', [MIYOTA_2035_SOURCE_IDS.product, MIYOTA_2035_SOURCE_IDS.specification]),
        fact('fact.miyota.2035.battery-life', 'Duración nominal de pila', 3, 'years', [MIYOTA_2035_SOURCE_IDS.product, MIYOTA_2035_SOURCE_IDS.specification]),
        fact('fact.miyota.2035.function', 'Funciones declaradas', ['3 hands', 'shock detection'], 'text', [MIYOTA_2035_SOURCE_IDS.product]),
      ],
      limitations: [
        'Los documentos se verifican en una caché local ignorada; no se redistribuyen ni se almacenan en el repositorio sin revisión de licencia.',
        'La huella registra los bytes servidos por la URL oficial y no equivale a una revisión editorial publicada por MIYOTA.',
        'El plano general y el despiece no aportan cotas completas por pieza.',
      ],
    },
    {
      manufacturer: 'MIYOTA',
      calibre: '8215',
      family: 'Standard Automatic / 82',
      mechanism: 'mechanical',
      status: 'curated',
      verifiedAt: consultedAt,
      documents: documents8215,
      facts: [
        fact('fact.miyota.8215.size', 'Tamaño', "11 1/2'''", 'ligne', [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.diameter', 'Diámetro nominal', 26, 'mm', [MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.height', 'Altura nominal', 5.67, 'mm', [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.accuracy-min', 'Límite inferior de precisión', -20, 'seconds-per-day', [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.accuracy-max', 'Límite superior de precisión', 40, 'seconds-per-day', [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.running-time', 'Reserva aproximada', 42, 'hours', [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.frequency', 'Frecuencia', 21600, 'vph', [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.jewels', 'Rubíes', 21, 'count', [MIYOTA_8215_SOURCE_IDS.product, MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.lift-angle', 'Ángulo de alzado', 49, 'degrees', [MIYOTA_8215_SOURCE_IDS.specification]),
        fact('fact.miyota.8215.function', 'Funciones declaradas', ['automatic and hand winding', 'quick date setting', '3 hands date', 'stop second device'], 'text', [MIYOTA_8215_SOURCE_IDS.product]),
      ],
      limitations: [
        'Los documentos se verifican en una caché local ignorada; no se redistribuyen ni se almacenan en el repositorio sin revisión de licencia.',
        'La huella registra los bytes servidos por la URL oficial y no equivale a una revisión editorial publicada por MIYOTA.',
        'El recuento oficial de 21 rubíes no identifica en la lista de recambios cada rubí como pieza independiente.',
        'No se infieren tolerancias, distancias entre centros ni contornos ocultos a partir de las imágenes.',
      ],
    },
    ...[
      ['82S0', 'Standard Automatic / 82', 'mechanical'],
      ['8N24', 'Standard Automatic / 8N', 'mechanical'],
      ['9015', 'Premium Automatic / 90', 'mechanical'],
      ['9039', 'Premium Automatic / 90', 'mechanical'],
      ['9100', 'Premium Automatic / 91', 'mechanical'],
      ['9120', 'Premium Automatic / 91', 'mechanical'],
    ].map(([calibre, family, mechanism]) => ({
      manufacturer: 'MIYOTA',
      calibre,
      family,
      mechanism,
      status: 'planned',
      documents: [],
      facts: [],
      limitations: ['Contrato reservado; las fuentes no se han curado en Sistema 4B.'],
    })),
  ],
})

const documentsById = new Map(
  MIYOTA_OFFICIAL_SOURCE_REGISTRY.entries.flatMap(({ documents }) => documents).map((item) => [item.id, item]),
)

export function officialDocument(sourceIdValue: string): OfficialDocumentRecord {
  const record = documentsById.get(sourceIdValue)
  if (!record) throw new Error(`Fuente oficial no registrada: ${sourceIdValue}`)
  return structuredClone(record)
}

export function officialSourceCitation(sourceIdValue: string, supportedClaim: string): SourceCitation {
  const source = officialDocument(sourceIdValue)
  return SourceCitationSchema.parse({
    id: source.id,
    authority: 'official-miyota',
    usage: source.localCopy.stored ? 'official-cached' : 'official-linked',
    resource: {
      kind: source.documentType === 'product-page' ? 'web-page' : 'pdf',
      title: source.title,
      locator: source.url,
      ...(source.localCopy.stored
        ? { sha256: source.localCopy.sha256 }
        : source.remoteIntegrity
          ? { sha256: source.remoteIntegrity.sha256 }
          : {}),
    },
    authorOrManufacturer: source.manufacturer,
    sourceType: 'official-miyota-documentation',
    calibre: source.calibre,
    movement: `MIYOTA ${source.calibre}`,
    revision: source.revision,
    retrievedAt: source.retrievedAt,
    privateUse: false,
    supportedClaim,
    derivedLayer: 'source',
  })
}

export type OfficialDocumentComparison = {
  status: 'verified' | 'drift' | 'unbaselined'
  differences: string[]
  requiresReview: boolean
}

/**
 * Compares a remote observation without mutating or accepting the curated baseline.
 * A drift is deliberately review-gated because an unversioned URL can serve new bytes.
 */
export function compareOfficialDocumentObservation(
  documentRecord: OfficialDocumentRecord,
  input: OfficialRemoteObservation,
): OfficialDocumentComparison {
  const observation = OfficialRemoteObservationSchema.parse(input)
  const differences: string[] = []
  if (observation.requestedUrl !== documentRecord.url) {
    differences.push(`URL solicitada distinta: ${observation.requestedUrl}`)
  }
  const finalUrl = new URL(observation.finalUrl)
  if (finalUrl.protocol !== 'https:' || finalUrl.hostname !== 'miyotamovement.com') {
    differences.push(`URL final fuera del origen oficial: ${observation.finalUrl}`)
  }
  if (!documentRecord.remoteIntegrity) {
    return {
      status: 'unbaselined',
      differences: [...differences, 'No existe una huella remota curada para comparar.'],
      requiresReview: true,
    }
  }
  if (observation.sha256 !== documentRecord.remoteIntegrity.sha256) {
    differences.push(`SHA-256 cambió: esperado ${documentRecord.remoteIntegrity.sha256}; observado ${observation.sha256}.`)
  }
  if (observation.sizeBytes !== documentRecord.remoteIntegrity.sizeBytes) {
    differences.push(`Tamaño cambió: esperado ${documentRecord.remoteIntegrity.sizeBytes}; observado ${observation.sizeBytes}.`)
  }
  if (observation.mediaType !== documentRecord.remoteIntegrity.mediaType) {
    differences.push(`Tipo cambió: esperado ${documentRecord.remoteIntegrity.mediaType}; observado ${observation.mediaType}.`)
  }
  if (observation.finalUrl !== documentRecord.remoteIntegrity.finalUrl) {
    differences.push(`URL final cambió: esperada ${documentRecord.remoteIntegrity.finalUrl}; observada ${observation.finalUrl}.`)
  }
  if (observation.hashMode !== documentRecord.remoteIntegrity.hashMode) {
    differences.push(`Modo de hash cambió: esperado ${documentRecord.remoteIntegrity.hashMode}; observado ${observation.hashMode}.`)
  }
  return differences.length > 0
    ? { status: 'drift', differences, requiresReview: true }
    : { status: 'verified', differences: [], requiresReview: false }
}

export const MIYOTA_OFFICIAL_SOURCE_REGISTRY_FINGERPRINT = stableFingerprint(MIYOTA_OFFICIAL_SOURCE_REGISTRY)
