import { z } from 'zod'

const semver = z.string().regex(/^\d+\.\d+\.\d+$/)

export const LearningDossierManifestSchema = z.object({
  format: z.literal('wplab-learning-dossier'),
  formatVersion: z.literal(1),
  createdAt: z.string().min(10),
  projectId: z.string().min(1),
  projectFingerprint: z.string().min(1),
  packageReferences: z.array(z.object({ id: z.string().min(1), version: semver }).strict()).default([]),
  sessionReferences: z.array(z.object({ id: z.string().min(1), entry: z.string().min(1) }).strict()).default([]),
  evidenceReferences: z.array(z.object({ id: z.string().min(1), entry: z.string().min(1) }).strict()).default([]),
  exclusions: z.array(z.enum([
    'global-profile',
    'complete-progress',
    'complete-history',
    'tutor-conversations',
    'private-pdfs',
    'cached-documents',
    'unknown-license-assets',
  ])).min(7),
}).strict()
export type LearningDossierManifest = z.infer<typeof LearningDossierManifestSchema>

export const LearningExportSelectionSchema = z.object({
  packageReferences: z.array(z.object({ id: z.string().min(1), version: semver }).strict()).default([]),
  sessionIds: z.array(z.string().min(1)).default([]),
  evidenceIds: z.array(z.string().min(1)).default([]),
}).strict()
export type LearningExportSelection = z.infer<typeof LearningExportSelectionSchema>

export const DEFAULT_LEARNING_EXPORT_EXCLUSIONS: LearningDossierManifest['exclusions'] = [
  'global-profile',
  'complete-progress',
  'complete-history',
  'tutor-conversations',
  'private-pdfs',
  'cached-documents',
  'unknown-license-assets',
]

function entryName(kind: 'sessions' | 'evidence', id: string): string {
  const safe = id.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `learning/${kind}/${safe}.json`
}

export function createLearningDossierManifest(
  project: { id: string; fingerprint: string },
  selection: LearningExportSelection,
  createdAt: string,
): LearningDossierManifest {
  const parsed = LearningExportSelectionSchema.parse(selection)
  return LearningDossierManifestSchema.parse({
    format: 'wplab-learning-dossier',
    formatVersion: 1,
    createdAt,
    projectId: project.id,
    projectFingerprint: project.fingerprint,
    packageReferences: parsed.packageReferences,
    sessionReferences: parsed.sessionIds.map((id) => ({ id, entry: entryName('sessions', id) })),
    evidenceReferences: parsed.evidenceIds.map((id) => ({ id, entry: entryName('evidence', id) })),
    exclusions: DEFAULT_LEARNING_EXPORT_EXCLUSIONS,
  })
}
