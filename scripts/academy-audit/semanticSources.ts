import {
  InventorySnapshotSchema,
  SourceAliasSchema,
  type InventorySnapshot,
  type SourceAlias,
  type SourceRecord,
} from '../../src/learning/governance/editorialGovernance'
import type { SourceRegistryResult } from './sources'

interface AliasOverride {
  canonicalSourceId: string
  currentLocator?: string | null
  previousLocator?: string | null
  sameWork?: boolean
  sameEdition?: boolean
  sameDocument?: boolean
  deprecationStatus: SourceAlias['deprecationStatus']
  migrationNotes: string[]
}

const aliasOverrides: Record<string, AliasOverride> = {
  'source.external.pocketwatchdatabase': {
    canonicalSourceId: 'source.external.pocket-watch-database',
    deprecationStatus: 'deprecated-alias',
    sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Duplicado confirmado por título y localizador; se conserva el sourceId antiguo.'],
  },
  'source.miyota.2035.official': {
    canonicalSourceId: 'source.miyota.2035.product-page', deprecationStatus: 'active-alias', sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Alias de la misma página oficial de producto MIYOTA 2035; no agrupa drawing, specification, instruction manual ni parts list.'],
  },
  'source.official.miyota.2035': {
    canonicalSourceId: 'source.miyota.2035.product-page', deprecationStatus: 'active-alias', sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Variante de ID de la página oficial MIYOTA 2035.'],
  },
  'source.miyota.8215.official': {
    canonicalSourceId: 'source.miyota.8215.product-page', deprecationStatus: 'active-alias', sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Alias de la misma página oficial de producto MIYOTA 8215; los PDF técnicos siguen siendo documentos distintos.'],
  },
  'source.official.miyota.8215': {
    canonicalSourceId: 'source.miyota.8215.product-page', deprecationStatus: 'active-alias', sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Variante de ID de la página oficial MIYOTA 8215.'],
  },
  'source.official.eta.2824': {
    canonicalSourceId: 'source.eta.2824-2.product', deprecationStatus: 'active-alias', sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Mismo recurso oficial ETA 2824-2 y mismo localizador.'],
  },
  'source.official.eta.6497': {
    canonicalSourceId: 'source.eta.6497-2.communication', deprecationStatus: 'active-alias', sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Misma comunicación técnica ETA 6497-2.'],
  },
  'source.official.eta.7750': {
    canonicalSourceId: 'source.eta.7750.communication', deprecationStatus: 'active-alias', sameWork: true, sameEdition: true, sameDocument: true,
    migrationNotes: ['Misma comunicación técnica ETA 7750.'],
  },
  'source.external.ashton-tracy': {
    canonicalSourceId: 'source.external.ashton-tracy',
    currentLocator: 'https://www.precisionhorology.ca/about',
    previousLocator: 'https://www.ashtontracy.ca/horological-insider',
    deprecationStatus: 'locator-updated', sameWork: true, sameEdition: false, sameDocument: false,
    migrationNotes: ['Ashton Tracy está asociado al recurso actual de Precision Horology; el ID histórico se conserva.'],
  },
  'source.external.horlogerie-suisse': {
    canonicalSourceId: 'source.external.horlogerie-suisse',
    currentLocator: 'https://archive.horlogerie-suisse.com/articles/articles.html',
    previousLocator: 'https://horlogerie-suisse.com/technique/base-de-l-horlogerie',
    deprecationStatus: 'locator-updated', sameWork: true, sameEdition: false, sameDocument: false,
    migrationNotes: ['Se conserva el recurso archivado verificable; la URL antigua queda como previousLocator. La equivalencia de página exacta requiere revisión manual.'],
  },
}

export function buildSourceAliases(records: SourceRecord[]): SourceAlias[] {
  const recordById = new Map(records.map((record) => [record.sourceId, record]))
  return records.map((record) => {
    const override = aliasOverrides[record.sourceId]
    const canonicalSourceId = override?.canonicalSourceId ?? record.sourceId
    if (!recordById.has(canonicalSourceId)) throw new Error(`Alias canónico ausente: ${record.sourceId} -> ${canonicalSourceId}`)
    return SourceAliasSchema.parse({
      sourceId: record.sourceId,
      canonicalSourceId,
      aliasOf: canonicalSourceId === record.sourceId ? null : canonicalSourceId,
      currentLocator: override?.currentLocator === undefined ? record.location.locator : override.currentLocator,
      previousLocator: override?.previousLocator ?? null,
      sameWork: override?.sameWork ?? true,
      sameEdition: override?.sameEdition ?? true,
      sameDocument: override?.sameDocument ?? true,
      deprecationStatus: override?.deprecationStatus ?? 'canonical',
      migrationNotes: override?.migrationNotes ?? [],
    })
  }).sort((left, right) => left.sourceId.localeCompare(right.sourceId))
}

export interface SnapshotDefinition {
  sourceId: string
  fileName: string
  expectedSha256: string
  method: InventorySnapshot['inventoryMethod']
  extractionTool: string
  notes: string[]
}

export const INVENTORY_SNAPSHOT_DEFINITIONS: SnapshotDefinition[] = [
  {
    sourceId: 'source.private.chicago.volume',
    fileName: 'Chicago CD.iso',
    expectedSha256: 'a969f30e81e355ad7e000b012a9a7e612d43e86c64eac179788188327cdccdfa',
    method: 'hybrid',
    extractionTool: 'snapshot curado; verificación 0.14A con pycdlib 1.20.0 y extracción temporal de solo lectura',
    notes: ['Topología, 35 lecciones, división 32a/32b y páginas fueron comprobadas en 0.14A.', 'La ejecución 0.14A.1 no afirma reabrir o extraer el ISO completo.'],
  },
  {
    sourceId: 'source.private.daniels.watchmaking-volume',
    fileName: 'Horologia_completa_OCR_ligera_100MB.pdf',
    expectedSha256: '78cb0b2931e256f42e6f2843c21be86e47762c0e53f755eef04c86c798e348b2',
    method: 'hybrid',
    extractionTool: 'snapshot curado; verificación 0.14A con pypdf/PyMuPDF y muestreo visual',
    notes: ['Rangos, figuras y conteos de patrones provienen del snapshot 0.14A.', 'Las fórmulas y tablas OCR no se consideran verificadas por este snapshot.'],
  },
]

export function buildInventorySnapshots(registry: SourceRegistryResult): InventorySnapshot[] {
  const originalByName = new Map(registry.localOriginals.map((original) => [original.fileName, original]))
  return INVENTORY_SNAPSHOT_DEFINITIONS.map((definition) => {
    const current = originalByName.get(definition.fileName)?.sha256 ?? null
    return InventorySnapshotSchema.parse({
      sourceId: definition.sourceId,
      inventoryMethod: definition.method,
      verifiedAgainstSha256: definition.expectedSha256,
      currentSha256: current,
      verificationValid: current === definition.expectedSha256,
      verifiedAt: '2026-08-14',
      verifiedBy: 'Watch Prototype Lab 0.14A manual source audit',
      sourceSnapshotVersion: '0.14A1.1',
      extractionTool: definition.extractionTool,
      manualVerificationNotes: definition.notes,
      requiresRevalidationOnHashChange: true,
    })
  })
}

export function invalidateSnapshotForHash(snapshot: InventorySnapshot, currentSha256: string): InventorySnapshot {
  return InventorySnapshotSchema.parse({ ...snapshot, currentSha256, verificationValid: currentSha256 === snapshot.verifiedAgainstSha256 })
}
