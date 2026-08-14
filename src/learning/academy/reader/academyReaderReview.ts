import type { AcademyEditorialReview, AcademyEditorialReviewFlag } from '../academyLocalState'
import { academyReaderStableHash } from './academyReaderIdentity'
import type { AcademyEditorialReviewStatus, AcademyReaderDocument } from './academyReaderModel'

export const ACADEMY_EDITORIAL_REVIEW_FLAG_LABELS: Readonly<Record<AcademyEditorialReviewFlag, string>> = {
  clear: 'Claro', confusing: 'Confuso', 'too-long': 'Demasiado largo', repetitive: 'Repetitivo',
  'visual-useful': 'Visual útil', 'visual-unnecessary': 'Visual innecesario', 'visual-incorrect': 'Visual incorrecto',
  'visual-insufficient': 'Visual insuficiente', 'terminology-doubtful': 'Terminología dudosa', 'source-doubtful': 'Fuente dudosa',
  'sequence-correct': 'Secuencia correcta', 'should-move': 'Debe moverse', 'watchmaker-review-required': 'Requiere revisión relojera',
}

export function academyReaderDocumentReviewHash(document: AcademyReaderDocument): string {
  return academyReaderStableHash(`${document.contentHash}|${document.identity?.structureHash ?? document.documentVersion}`)
}

export function academyEditorialReviewStatus(
  document: AcademyReaderDocument,
  review: AcademyEditorialReview | undefined,
): AcademyEditorialReviewStatus {
  if (!review) return 'owner-review-pending'
  if (review.contentHash !== document.contentHash || review.readerDocumentHash !== academyReaderDocumentReviewHash(document)) {
    return 'stale-after-content-change'
  }
  return review.status === 'owner-reviewed' ? 'owner-reviewed' : 'owner-review-pending'
}

export function createAcademyEditorialReviewDraft(
  document: AcademyReaderDocument,
  now = new Date().toISOString(),
): AcademyEditorialReview {
  return {
    lessonId: document.lessonId,
    contentHash: document.contentHash,
    readerDocumentHash: academyReaderDocumentReviewHash(document),
    status: 'draft',
    reviewedFields: [],
    sectionReviews: [],
    version: '0.14D',
    updatedAt: now,
  }
}

export function academyEditorialStatusLabel(status: AcademyEditorialReviewStatus): string {
  const labels: Record<AcademyEditorialReviewStatus, string> = {
    'automated-structural-migration': 'Estructura generada automáticamente · pendiente de revisión',
    'codex-assisted-curation': 'Curación asistida · pendiente de revisión',
    'owner-review-pending': 'Pendiente de revisión del propietario',
    'owner-reviewed': 'Revisada por el propietario',
    'technical-expert-review-pending': 'Pendiente de revisión relojera',
    'technical-expert-reviewed': 'Revisada por especialista técnico',
    'stale-after-content-change': 'Revisión obsoleta tras un cambio de contenido',
  }
  return labels[status]
}
