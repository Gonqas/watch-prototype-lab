export type AcademyMiyotaSnapshotStatus = 'verified-current' | 'drift-reviewed' | 'discovery-only'

export interface AcademyMiyotaSourceSnapshot014JRecord {
  snapshotId: string
  sourceId: string | null
  documentType: 'product-page' | 'specification' | 'drawing' | 'instruction-manual' | 'parts-list-exploded-view' | 'dial-drawing'
  title: string
  currentLocator: string
  previousLocator: string | null
  currentSha256: string
  previousSha256: string | null
  sizeBytes: number
  pages: number | null
  checkedAt: '2026-08-16'
  visualInspection: 'complete' | 'not-applicable'
  status: AcademyMiyotaSnapshotStatus
  scope: string
  limitations: readonly string[]
}

const record = (value: AcademyMiyotaSourceSnapshot014JRecord) => value

export const ACADEMY_MIYOTA_8215_SOURCE_SNAPSHOT_014J: readonly AcademyMiyotaSourceSnapshot014JRecord[] = [
  record({ snapshotId: 'snapshot.miyota.8215.product-page.2026-08-16', sourceId: 'source.miyota.8215.product-page', documentType: 'product-page', title: 'MIYOTA 8215 · página oficial', currentLocator: 'https://miyotamovement.com/product/8215/', previousLocator: 'https://miyotamovement.com/product/8215/', currentSha256: 'c7eb21fbcca4f874f2a971ee53b4e4ad62356a5d9ec68cc94e620db8f3fa7c9d', previousSha256: '42abce52fa872351b448151ca7b79c0905b41ad33b2a0f2a2edef781686423db', sizeBytes: 53456, pages: null, checkedAt: '2026-08-16', visualInspection: 'not-applicable', status: 'drift-reviewed', scope: 'Identidad, familia comercial, funciones, resumen de especificaciones y enlaces documentales vigentes.', limitations: ['No demuestra servicio, piezas internas detalladas, lubricación ni tolerancias no publicadas.'] }),
  record({ snapshotId: 'snapshot.miyota.8215.specification.bcb22d8e', sourceId: 'source.miyota.8215.specification', documentType: 'specification', title: 'MIYOTA 8215 · specification', currentLocator: 'https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf', previousLocator: null, currentSha256: 'bcb22d8e921b06165e67ffbbecfbcc444b8a67ccb4319d598c14bda6216418dc', previousSha256: 'bcb22d8e921b06165e67ffbbecfbcc444b8a67ccb4319d598c14bda6216418dc', sizeBytes: 100856, pages: 2, checkedAt: '2026-08-16', visualInspection: 'complete', status: 'verified-current', scope: 'Datos visibles de 8215/8205, condiciones de medición y winding information de la familia indicada.', limitations: ['Los datos se aplican solo al modelo y zona documental citados.', 'Las holguras dibujadas se reservan para integración de etapa 5.'] }),
  record({ snapshotId: 'snapshot.miyota.8215.drawing.95db1834', sourceId: 'source.miyota.8215.drawing', documentType: 'drawing', title: 'MIYOTA 8215 · drawing', currentLocator: 'https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf', previousLocator: null, currentSha256: '95db183473b7372aad4f80665c23cdff32d5f64fdfe63b1cc3828811ef132c54', previousSha256: '95db183473b7372aad4f80665c23cdff32d5f64fdfe63b1cc3828811ef132c54', sizeBytes: 263227, pages: 4, checkedAt: '2026-08-16', visualInspection: 'complete', status: 'verified-current', scope: 'Cotas y referencias expresamente dibujadas en cuatro páginas.', limitations: ['No se infieren tolerancias, geometría oculta ni ajuste de piezas no acotadas.'] }),
  record({ snapshotId: 'snapshot.miyota.8215.instruction-manual.6286b843', sourceId: 'source.miyota.8215.instruction-manual', documentType: 'instruction-manual', title: 'Cal. 8215 Instruction manual', currentLocator: 'https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf', previousLocator: null, currentSha256: '6286b8431619f825b6bfd2715be78891dd2cd7ba3dfbead3959d570b08e2afb9', previousSha256: '6286b8431619f825b6bfd2715be78891dd2cd7ba3dfbead3959d570b08e2afb9', sizeBytes: 44260, pages: 1, checkedAt: '2026-08-16', visualInspection: 'complete', status: 'verified-current', scope: 'Posiciones de corona, ajuste de hora y corrección rápida de fecha del 8215.', limitations: ['Es un manual de usuario, no un manual de servicio.', 'La advertencia de fecha se limita al 8215 y no se mezcla con el 8205.'] }),
  record({ snapshotId: 'snapshot.miyota.8215.parts-list.fdafef81', sourceId: 'source.miyota.8215.parts-list-exploded-view', documentType: 'parts-list-exploded-view', title: 'Cal.8215 Parts List', currentLocator: 'https://miyotamovement.com/uploads/product/product_PveYk926HfOtdLJUux.pdf', previousLocator: 'https://miyotamovement.com/uploads/product/product_x2MOZCosd7iH59wu0K.pdf', currentSha256: 'fdafef819f8d0f3d91e4062072ce13a05beb20a4a61b96c6e2415500281657ad', previousSha256: 'ea5f619949fba80737c7d0db6dbef128d302ec23625ec77aca25d5ee63012e0d', sizeBytes: 102912, pages: 1, checkedAt: '2026-08-16', visualInspection: 'complete', status: 'drift-reviewed', scope: 'Nombres, referencias y cantidades indicadas; el exploded view web aporta posición relativa aproximada.', limitations: ['No demuestra orden, dirección, herramienta, par, lubricación o tolerancia.'] }),
  record({ snapshotId: 'snapshot.miyota.8215.dial.33e.d24a8496', sourceId: null, documentType: 'dial-drawing', title: 'CAL.8215-33E dial drawing', currentLocator: 'https://miyotamovement.com/uploads/product/product_e1LVWPzublqQIDFgYh.pdf', previousLocator: null, currentSha256: 'd24a8496bc5c4139abd3230579e450f80b8646355b10f102f2eff31ab2cdc5ad', previousSha256: null, sizeBytes: 41221, pages: 1, checkedAt: '2026-08-16', visualInspection: 'complete', status: 'discovery-only', scope: 'Variante de esfera 8215-33E; registrada para futura etapa 5.', limitations: ['No se incorpora a compatibilidad de esfera en etapa 4.'] }),
  record({ snapshotId: 'snapshot.miyota.8215.dial.36e.be8d0c2d', sourceId: null, documentType: 'dial-drawing', title: 'CAL.8215-36E dial drawings', currentLocator: 'https://miyotamovement.com/uploads/product/product_gtIlMOi0fnaLCYQNAV.pdf', previousLocator: null, currentSha256: 'be8d0c2d1cd1d96dd42faed0d50b02465296edfe3f5770abef00f50b18a7edc4', previousSha256: null, sizeBytes: 73712, pages: 2, checkedAt: '2026-08-16', visualInspection: 'complete', status: 'discovery-only', scope: 'Variantes 8215-36E; registradas para futura etapa 5.', limitations: ['No se transfieren cotas entre variantes ni se inicia integración de esfera.'] }),
]

export const ACADEMY_MIYOTA_8215_SOURCE_ALIASES_014J = [
  { sourceId: 'source.miyota.8215.official', canonicalSourceId: 'source.miyota.8215.product-page', status: 'active-alias' },
  { sourceId: 'source.official.miyota.8215', canonicalSourceId: 'source.miyota.8215.product-page', status: 'active-alias' },
] as const

export function academyMiyota8215Snapshot014J(snapshotId: string) {
  return ACADEMY_MIYOTA_8215_SOURCE_SNAPSHOT_014J.find((item) => item.snapshotId === snapshotId)
}
