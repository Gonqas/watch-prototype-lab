import type { LearningPack } from '../content/learningPack'
import type { LearningBinaryStorage } from '../persistence/binaryStorage'
import type { InstalledLearningPackage } from '../persistence/models'
import type { LearningRepository } from '../persistence/repository'
import { LearningPackageLoader, type LearningPackageOrigin } from '../runtime/packageLoader'
import {
  createLearningProductIndex,
  mergeLearningProductIndexes,
  type LearningProductIndex,
} from './demoPackage'
import type { CompositeAssessmentRule } from '../persistence/assessmentEngine'
import type { EvidenceExtractionRule } from '../persistence/evidenceEngine'

export interface InstalledLearningContent {
  record: InstalledLearningPackage
  pack: LearningPack
  bytes: Uint8Array
  origin: LearningPackageOrigin
  product: LearningProductIndex
}

export interface InstalledContentDiagnostic {
  packageId: string
  packageVersion: string
  code: string
  message: string
}

export interface InstalledContentCatalog {
  contents: InstalledLearningContent[]
  product: LearningProductIndex
  diagnostics: InstalledContentDiagnostic[]
}

const activePackage = ({ status }: InstalledLearningPackage): boolean =>
  status === 'active' || status === 'retained'

export async function loadInstalledLearningContent(
  record: InstalledLearningPackage,
  storage: LearningBinaryStorage,
  loader: LearningPackageLoader,
): Promise<InstalledLearningContent> {
  if (!activePackage(record)) {
    throw new Error(`El paquete ${record.packageId}@${record.version} no está activo (${record.status}).`)
  }
  const bytes = await storage.read(record.packageHash)
  if (!bytes) {
    throw new Error(`No se encontró el binario ${record.packageHash} de ${record.packageId}@${record.version}.`)
  }
  const loaded = await loader.loadFromBytes(bytes, record.origin)
  if (!loaded.success) {
    throw new Error(loaded.diagnostics.map(({ code, message }) => `${code}: ${message}`).join(' '))
  }
  if (
    loaded.value.pack.manifest.id !== record.packageId
    || loaded.value.pack.manifest.packageVersion !== record.version
  ) {
    throw new Error(
      `El binario almacenado declara ${loaded.value.pack.manifest.id}@${loaded.value.pack.manifest.packageVersion}, `
      + `pero el registro fija ${record.packageId}@${record.version}.`,
    )
  }
  if (loaded.value.packageFingerprint !== record.packageHash) {
    throw new Error(
      `Fingerprint divergente para ${record.packageId}@${record.version}: `
      + `${loaded.value.packageFingerprint} != ${record.packageHash}.`,
    )
  }
  return {
    record: structuredClone(record),
    pack: structuredClone(loaded.value.pack),
    bytes: bytes.slice(),
    origin: record.origin,
    product: createLearningProductIndex(loaded.value.pack),
  }
}

export async function buildInstalledContentCatalog(
  repository: LearningRepository,
  storage: LearningBinaryStorage,
  applicationVersion: string,
): Promise<InstalledContentCatalog> {
  const loader = new LearningPackageLoader({ applicationVersion })
  const records = (await repository.listPackages({ limit: 500 })).items
    .filter(activePackage)
    .sort((left, right) =>
      left.packageId.localeCompare(right.packageId) || left.version.localeCompare(right.version))
  const contents: InstalledLearningContent[] = []
  const diagnostics: InstalledContentDiagnostic[] = []
  for (const record of records) {
    try {
      contents.push(await loadInstalledLearningContent(record, storage, loader))
    } catch (error) {
      diagnostics.push({
        packageId: record.packageId,
        packageVersion: record.version,
        code: 'LA-INSTALLED-CONTENT-UNREADABLE',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  if (contents.length === 0) {
    throw new Error(
      diagnostics.length > 0
        ? diagnostics.map(({ packageId, packageVersion, message }) => `${packageId}@${packageVersion}: ${message}`).join(' ')
        : 'No hay contenido de aprendizaje activo.',
    )
  }
  return {
    contents,
    product: mergeLearningProductIndexes(contents.map(({ product }) => product)),
    diagnostics,
  }
}

export function findInstalledContent(
  catalog: InstalledContentCatalog,
  packageId: string,
  packageVersion: string,
): InstalledLearningContent | undefined {
  const content = catalog.contents.find(({ pack }) =>
    pack.manifest.id === packageId && pack.manifest.packageVersion === packageVersion)
  return content
    ? {
        record: structuredClone(content.record),
        pack: structuredClone(content.pack),
        bytes: content.bytes.slice(),
        origin: content.origin,
        product: structuredClone(content.product),
      }
    : undefined
}

export function installedEvidenceRules(catalog: InstalledContentCatalog): EvidenceExtractionRule[] {
  return catalog.contents.flatMap(({ pack }) =>
    pack.evidenceTemplates.flatMap(({ extraction }) => extraction ? [structuredClone(extraction)] : []))
}

export function installedAssessmentRuleForActivity(
  catalog: InstalledContentCatalog,
  packageId: string,
  packageVersion: string,
  activityId: string,
): CompositeAssessmentRule {
  const content = findInstalledContent(catalog, packageId, packageVersion)
  const activity = content?.pack.activities.find(({ id }) => id === activityId)
  const rubric = content?.pack.rubrics.find(({ id }) => id === activity?.rubricId)
  if (!rubric?.assessmentRule) {
    throw new Error(`La actividad ${activityId} no tiene una assessmentRule ejecutable en ${packageId}@${packageVersion}.`)
  }
  return structuredClone(rubric.assessmentRule)
}
