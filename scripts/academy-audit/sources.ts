import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, normalize } from 'node:path'
import type { SourceCitation } from '../../src/learning/sources'
import {
  SourceRecordSchema,
  type HistoricalStatus,
  type SourceRecord,
  type VerificationStatus,
} from '../../src/learning/governance/editorialGovernance'
import type { AcademyCorpus } from './corpus'
import { ORIGINAL_SOURCE_FILES } from './sourceInventory'

export interface LocalOriginalIntegrity {
  sourceId: string
  fileName: string
  relativePath: string
  available: boolean
  bytes: number | null
  sha256: string | null
  pages: number | null
}

export interface SourceRegistryResult {
  records: SourceRecord[]
  localOriginals: LocalOriginalIntegrity[]
  missingLocalOriginals: string[]
}

async function sha256File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(path)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

async function inspectOriginals(repositoryRoot: string): Promise<LocalOriginalIntegrity[]> {
  return Promise.all(ORIGINAL_SOURCE_FILES.map(async (source) => {
    const relativePath = `reference-library/originals/${source.fileName}`
    const path = join(repositoryRoot, 'reference-library', 'originals', source.fileName)
    try {
      const metadata = await stat(path)
      return {
        sourceId: source.sourceId,
        fileName: source.fileName,
        relativePath,
        available: true,
        bytes: metadata.size,
        sha256: await sha256File(path),
        pages: source.pages,
      }
    } catch {
      return {
        sourceId: source.sourceId,
        fileName: source.fileName,
        relativePath,
        available: false,
        bytes: null,
        sha256: null,
        pages: source.pages,
      }
    }
  }))
}

function citationScore(citation: SourceCitation): number {
  return Number(Boolean(citation.page || citation.figure)) * 20
    + Number(Boolean(citation.chapter || citation.region)) * 10
    + Number(Boolean(citation.resource.sha256)) * 5
    + Number(Boolean(citation.validationPolicy)) * 3
    + Number(Boolean(citation.historicalSafety)) * 3
    + Object.keys(citation).length
}

function uniqueCitations(citations: SourceCitation[]): SourceCitation[] {
  const byJson = new Map(citations.map((citation) => [JSON.stringify(citation), citation]))
  return [...byJson.values()].sort((left, right) => citationScore(right) - citationScore(left)
    || JSON.stringify(left).localeCompare(JSON.stringify(right)))
}

type EditorialFunction = SourceRecord['editorialFunction']

function editorialFunction(citation: SourceCitation): EditorialFunction {
  if (citation.id.includes('.chicago.')) return 'E-chicago-school'
  if (citation.id.includes('.daniels.') || citation.id === 'source.private.horologia-book') return 'C-daniels-watchmaking'
  if (citation.id.includes('.bulova.')) return 'D-bulova-school'
  if (citation.id.includes('.tm.') || citation.id.includes('tm9-1575')) return 'F-tm-9-1575'
  if (citation.id.includes('.toh.')) return 'B-theory-of-horology'
  if (citation.authority === 'official-miyota' || citation.authority === 'manufacturer-primary') return 'A-manufacturer-official'
  if (citation.authority === 'reference-database' || citation.sourceClass === 'database-index') return 'H-reference-database'
  if (citation.authority === 'expert-practice'
    || citation.authority === 'educational-secondary'
    || citation.authority === 'technical-training'
    || citation.authority === 'community-discovery') return 'G-watchmaker-or-visual-resource'
  if (citation.authority === 'original-educational' || citation.authority === 'educational-derived') return 'project-original'
  return 'other'
}

function policyForFunction(value: EditorialFunction): {
  authority: string[]
  applicable: string[]
  excluded: string[]
  risks: string[]
  corroboration: boolean
  reuse: string
} {
  switch (value) {
    case 'A-manufacturer-official': return {
      authority: ['calibre-specific dimensions, references, parts, sequences, lubrication, tolerances, and service data'],
      applicable: ['the documented calibre, revision, and component scope'],
      excluded: ['general horological theory outside the documented calibre'],
      risks: [],
      corroboration: false,
      reuse: 'Cite the exact manufacturer document and locator. Link or retain metadata only unless redistribution is explicitly permitted.',
    }
    case 'B-theory-of-horology': return {
      authority: ['general theory, physics, architecture, trains, energy, escapements, regulation, and complications'],
      applicable: ['conceptual and causal explanation'],
      excluded: ['calibre-specific service sequences or tolerances'],
      risks: ['chapter scans require page-level verification for precise numeric claims'],
      corroboration: false,
      reuse: 'Store metadata and short educational synthesis only; never copy scans or extended text into runtime content.',
    }
    case 'C-daniels-watchmaking': return {
      authority: ['manufacturing, geometric layout, turning, wheels, pinions, small components, jewelling, escapements, movement design, cases, and dials'],
      applicable: ['advanced making, design, and historical craft comparison'],
      excluded: ['calibre-specific industrial service authority', 'unverified OCR formulas, tables, symbols, or dimensions'],
      risks: ['OCR ambiguity', 'historical chemical, heat, flame, machinery, and electroplating procedures'],
      corroboration: true,
      reuse: 'Metadata, page locators, and original educational synthesis only. Formulae and tables require direct visual verification; hazardous historical procedures remain non-actionable.',
    }
    case 'D-bulova-school': return {
      authority: ['psychomotor progression, tools, repetition, micromechanics, and skill-passport structure'],
      applicable: ['practice progression and documented physical evidence design'],
      excluded: ['modern chemical and workshop safety authority'],
      risks: ['historical safety context'],
      corroboration: true,
      reuse: 'Use as a historical pedagogical source. Do not reproduce pages or adopt safety guidance without modern corroboration.',
    }
    case 'E-chicago-school': return {
      authority: ['worksheets, repair sequences, exercises, review questions, and practical organization'],
      applicable: ['historical cases and manually reviewed worksheet seeds'],
      excluded: ['current chemical, thermal, luminous-material, lead, solvent, flame, or machinery instruction'],
      risks: ['historical hazardous procedures', 'answer keys are not automatically current truth'],
      corroboration: true,
      reuse: 'Metadata and short educational synthesis only. Hazardous historical procedures are never converted to actionable Academy instructions.',
    }
    case 'F-tm-9-1575': return {
      authority: ['inspection order, diagnostic process, observation before disassembly, hypothesis, and checking'],
      applicable: ['diagnostic reasoning and historical inspection cases'],
      excluded: ['uncorroborated historical tolerances, substances, intervals, and procedures'],
      risks: ['historical procedure and substance guidance'],
      corroboration: true,
      reuse: 'Use metadata, locators, and educational synthesis. Mark technical values and procedures historical unless corroborated.',
    }
    case 'G-watchmaker-or-visual-resource': return {
      authority: ['real cases, defects, photographs, restorations, and transfer examples within the documented case'],
      applicable: ['case studies, visual comparison, and discovery'],
      excluded: ['generalization from a single unit or author observation'],
      risks: ['case-specific inference'],
      corroboration: true,
      reuse: 'Link and cite the exact case. Do not copy third-party media or generalize beyond the documented unit.',
    }
    case 'H-reference-database': return {
      authority: ['identification discovery, families, equivalences, dates, and candidate records'],
      applicable: ['discovery and cross-check planning'],
      excluded: ['final lubrication, tolerance, compatibility, dimension, or service authority'],
      risks: ['secondary or community-maintained data'],
      corroboration: true,
      reuse: 'Metadata and links only. Confirm every technical value in manufacturer documentation or measurement.',
    }
    case 'project-original': return {
      authority: ['project-original pedagogy, explanations, and interface contracts'],
      applicable: ['educational structure and explicitly original synthesis'],
      excluded: ['external technical facts without an underlying source'],
      risks: ['derived statements can exceed cited evidence if provenance is lost'],
      corroboration: false,
      reuse: 'Reusable within the project while preserving underlying citations and explicit fidelity limits.',
    }
    case 'other': return {
      authority: ['scope declared by the individual citation'],
      applicable: ['only the supported claim and declared locator'],
      excluded: ['any unstated technical authority'],
      risks: ['authority requires manual classification'],
      corroboration: true,
      reuse: 'Manual editorial review required before reuse.',
    }
  }
}

function historicalStatus(citation: SourceCitation, value: EditorialFunction): HistoricalStatus {
  if (citation.currency === 'current') return 'current'
  if (citation.currency === 'mixed') return 'mixed'
  if (citation.currency === 'historical') {
    return citation.historicalSafety?.operationalUse === 'blocked' ? 'historical-non-actionable' : 'historical-context'
  }
  if (['D-bulova-school', 'E-chicago-school', 'F-tm-9-1575'].includes(value)) return 'historical-context'
  return 'unknown'
}

function verificationStatus(citation: SourceCitation, value: EditorialFunction): VerificationStatus {
  if (value === 'A-manufacturer-official') return 'verified-primary'
  if (value === 'C-daniels-watchmaking') return 'ocr-unverified'
  if (['D-bulova-school', 'E-chicago-school', 'F-tm-9-1575'].includes(value)) return 'requires-modern-corroboration'
  if (citation.authorityTier && ['A', 'B', 'C'].includes(citation.authorityTier)) return 'verified-secondary'
  if (value === 'project-original') return 'inferred'
  return 'unknown'
}

function precision(citations: SourceCitation[]): SourceRecord['citationPrecision'] {
  if (citations.some(({ page, figure }) => page || figure)) return 'page-or-figure'
  if (citations.some(({ chapter, region }) => chapter || region)) return 'chapter-or-section'
  if (citations.some(({ resource }) => resource.locator)) return 'document'
  return 'missing'
}

function locatorIsLocal(locator: string | undefined): boolean {
  return Boolean(locator && (normalize(locator).startsWith(normalize('reference-library')) || locator.startsWith('private-library:')))
}

export async function buildSourceRegistry(repositoryRoot: string, corpus: AcademyCorpus): Promise<SourceRegistryResult> {
  const localOriginals = await inspectOriginals(repositoryRoot)
  const originalByFile = new Map(localOriginals.map((original) => [original.fileName, original]))
  const citationsById = new Map<string, SourceCitation[]>()
  const packageIdsBySource = new Map<string, Set<string>>()
  const lessonIdsBySource = new Map<string, Set<string>>()
  const activityIdsBySource = new Map<string, Set<string>>()
  const addCitation = (citation: SourceCitation, packageId: string) => {
    citationsById.set(citation.id, [...(citationsById.get(citation.id) ?? []), citation])
    const packageIds = packageIdsBySource.get(citation.id) ?? new Set<string>()
    packageIds.add(packageId)
    packageIdsBySource.set(citation.id, packageIds)
  }

  for (const { pack } of corpus.packs) {
    pack.sources.forEach((citation) => addCitation(citation, pack.manifest.id))
    pack.blocks.forEach((block) => block.claims.forEach((claim) => claim.sources.forEach((citation) => addCitation(citation, pack.manifest.id))))
  }
  for (const context of corpus.lessons) {
    const sourceIds = new Set([
      ...(context.lesson.authoring?.sourceIds ?? []),
      ...context.lesson.blockIds.flatMap((blockId) => context.pack.blocks.find(({ id }) => id === blockId)?.claims
        .flatMap(({ sources }) => sources.map(({ id }) => id)) ?? []),
    ])
    for (const sourceId of sourceIds) {
      const ids = lessonIdsBySource.get(sourceId) ?? new Set<string>()
      ids.add(context.lesson.id)
      lessonIdsBySource.set(sourceId, ids)
    }
  }
  for (const context of corpus.activities) {
    for (const sourceId of context.activity.authoring?.sourceIds ?? []) {
      const ids = activityIdsBySource.get(sourceId) ?? new Set<string>()
      ids.add(context.activity.id)
      activityIdsBySource.set(sourceId, ids)
    }
  }

  const records = [...citationsById.entries()].map(([sourceId, rawCitations]) => {
    const citations = uniqueCitations(rawCitations)
    const canonical = citations[0]
    const role = editorialFunction(canonical)
    const policy = policyForFunction(role)
    const locator = canonical.resource.locator ?? `unresolved:${sourceId}`
    const matchingOriginal = [...originalByFile.entries()].find(([fileName]) => locator.includes(fileName))?.[1]
    const conflictFields = ['authority', 'usage', 'resource.title', 'resource.locator'].filter((field) => {
      const values = new Set(citations.map((citation) => {
        if (field === 'resource.title') return citation.resource.title
        if (field === 'resource.locator') return citation.resource.locator ?? ''
        return String(citation[field as 'authority' | 'usage'])
      }))
      return values.size > 1
    })
    const risks = [...new Set([
      ...policy.risks,
      ...citations.flatMap(({ historicalSafety }) => historicalSafety?.hazardTopics ?? []),
      ...citations.flatMap(({ limitations }) => limitations ?? []).filter((value) => /hazard|pelig|safety|seguridad|toxic|qu[ií]mic|flame|heat|acid|lead|mercur/i.test(value)),
    ])]
    const record: SourceRecord = {
      sourceId,
      title: canonical.resource.title,
      authorOrEntity: canonical.authorOrManufacturer ?? 'Unknown - manual review pending',
      editionOrDate: canonical.edition ?? canonical.revision ?? (canonical.year ? String(canonical.year) : null),
      languages: canonical.languages?.length ? [...canonical.languages] : ['unknown'],
      sourceType: canonical.sourceType ?? canonical.resource.kind,
      editorialFunction: role,
      subjectAuthority: policy.authority,
      applicableScopes: policy.applicable,
      nonApplicableScopes: policy.excluded,
      historicalStatus: historicalStatus(canonical, role),
      ocrQuality: role === 'C-daniels-watchmaking' ? 'mixed'
        : role === 'E-chicago-school' ? 'mixed'
          : canonical.resource.kind === 'web-page' || canonical.resource.kind === 'dataset' ? 'not-applicable'
            : 'unknown',
      imageAvailability: ['B-theory-of-horology', 'C-daniels-watchmaking', 'D-bulova-school', 'E-chicago-school', 'F-tm-9-1575'].includes(role)
        ? 'yes'
        : canonical.pedagogicalUses?.includes('visual-reference') ? 'partial' : 'unknown',
      knownRisks: risks,
      requiresModernCorroboration: policy.corroboration || citations.some(({ historicalSafety }) => historicalSafety?.reviewedAgainstModernGuidance === false),
      location: {
        kind: locatorIsLocal(locator) ? 'private-local'
          : canonical.authority === 'original-educational' ? 'project-original'
            : canonical.availability === 'unavailable' ? 'unavailable' : 'external',
        locator,
      },
      reusePolicy: policy.reuse,
      checksumSha256: canonical.resource.sha256 ?? matchingOriginal?.sha256 ?? null,
      verificationStatus: verificationStatus(canonical, role),
      packageIds: [...(packageIdsBySource.get(sourceId) ?? [])].sort(),
      usedByLessonIds: [...(lessonIdsBySource.get(sourceId) ?? [])].sort(),
      usedByActivityIds: [...(activityIdsBySource.get(sourceId) ?? [])].sort(),
      citationPrecision: precision(citations),
      citationVariants: citations,
      editorialNotes: [
        ...(canonical.editorialComment ? [canonical.editorialComment] : []),
        ...(conflictFields.length > 0 ? [`Conflicting citation metadata requires reconciliation: ${conflictFields.join(', ')}.`] : []),
        ...(canonical.originalSourceId ? [`Derived layer linked to ${canonical.originalSourceId}.`] : []),
      ],
    }
    return SourceRecordSchema.parse(record)
  })

  for (const source of ORIGINAL_SOURCE_FILES) {
    if (records.some(({ sourceId }) => sourceId === source.sourceId)) continue
    const original = originalByFile.get(source.fileName)
    const role: EditorialFunction = source.fileName.startsWith('Chicago') ? 'E-chicago-school'
      : source.fileName.startsWith('Horologia') ? 'C-daniels-watchmaking'
        : source.fileName.startsWith('Joseph Bulova') ? 'D-bulova-school'
          : source.fileName.startsWith('Theory of Horology') ? 'B-theory-of-horology'
            : source.fileName.startsWith('TM 9-1575') ? 'F-tm-9-1575'
              : source.fileName.startsWith('horologia_sistema') ? 'project-original' : 'other'
    const policy = policyForFunction(role)
    records.push(SourceRecordSchema.parse({
      sourceId: source.sourceId,
      title: source.title,
      authorOrEntity: source.authorOrEntity,
      editionOrDate: null,
      languages: [...source.languages],
      sourceType: source.sourceType,
      editorialFunction: role,
      subjectAuthority: policy.authority,
      applicableScopes: policy.applicable,
      nonApplicableScopes: policy.excluded,
      historicalStatus: ['D-bulova-school', 'E-chicago-school', 'F-tm-9-1575'].includes(role) ? 'historical-context' : 'unknown',
      ocrQuality: source.ocrQuality,
      imageAvailability: source.imageAvailability,
      knownRisks: policy.risks,
      requiresModernCorroboration: policy.corroboration,
      location: { kind: original?.available ? 'private-local' : 'unavailable', locator: original?.relativePath ?? `reference-library/originals/${source.fileName}` },
      reusePolicy: policy.reuse,
      checksumSha256: original?.sha256 ?? null,
      verificationStatus: original?.available
        ? role === 'C-daniels-watchmaking' ? 'ocr-unverified'
          : ['D-bulova-school', 'E-chicago-school', 'F-tm-9-1575'].includes(role) ? 'requires-modern-corroboration'
            : 'verified-secondary'
        : 'unknown',
      packageIds: [],
      usedByLessonIds: [],
      usedByActivityIds: [],
      citationPrecision: 'document',
      citationVariants: [],
      editorialNotes: original?.available ? ['Volume-level record; chapter- or lesson-level records carry the operational citation scope.'] : ['Local original not accessible during this audit.'],
    }))
  }

  records.sort((left, right) => left.sourceId.localeCompare(right.sourceId))
  return {
    records,
    localOriginals,
    missingLocalOriginals: localOriginals.filter(({ available }) => !available).map(({ relativePath }) => relativePath),
  }
}
