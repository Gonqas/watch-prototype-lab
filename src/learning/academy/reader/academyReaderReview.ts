import type { AcademyEditorialReview, AcademyEditorialReviewFlag } from '../academyLocalState'
import { academyReaderStableHash } from './academyReaderIdentity'
import type {
  AcademyEditorialReviewStatus,
  AcademyPersonalReviewFlag,
  AcademyPersonalReviewStatus,
  AcademyReaderDocument,
} from './academyReaderModel'

export const ACADEMY_EDITORIAL_REVIEW_FLAG_LABELS: Readonly<Record<AcademyEditorialReviewFlag, string>> = {
  'se-entiende': 'Se entiende', 'no-se-entiende': 'No se entiende', 'demasiado-tecnico': 'Demasiado técnico',
  'falta-explicacion': 'Falta explicación', 'falta-ejemplo': 'Falta ejemplo', 'falta-visual': 'Falta visual',
  'visual-no-ayuda': 'El visual no ayuda', 'demasiado-repetitivo': 'Demasiado repetitivo',
  'practica-confusa': 'La práctica es confusa', 'fuente-dudosa': 'La fuente resulta dudosa',
  'revisar-mas-adelante': 'Revisar más adelante',
  clear: 'Claro', confusing: 'Confuso', 'too-long': 'Demasiado largo', repetitive: 'Repetitivo',
  'visual-useful': 'Visual útil', 'visual-unnecessary': 'Visual innecesario', 'visual-incorrect': 'Visual incorrecto',
  'visual-insufficient': 'Visual insuficiente', 'terminology-doubtful': 'Terminología dudosa', 'source-doubtful': 'Fuente dudosa',
  'sequence-correct': 'Secuencia correcta', 'should-move': 'Debe moverse', 'watchmaker-review-required': 'Requiere revisión relojera',
}

export const ACADEMY_PERSONAL_REVIEW_FLAG_LABELS: Readonly<Record<AcademyPersonalReviewFlag, string>> = {
  'se-entiende': 'Se entiende', 'no-se-entiende': 'No se entiende', 'demasiado-tecnico': 'Demasiado técnico',
  'falta-explicacion': 'Falta explicación', 'falta-ejemplo': 'Falta ejemplo', 'falta-visual': 'Falta visual',
  'visual-no-ayuda': 'El visual no ayuda', 'demasiado-repetitivo': 'Demasiado repetitivo',
  'practica-confusa': 'La práctica es confusa', 'fuente-dudosa': 'La fuente resulta dudosa',
  'revisar-mas-adelante': 'Revisar más adelante',
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
  version: AcademyEditorialReview['version'] = '0.14D',
): AcademyEditorialReview {
  return {
    lessonId: document.lessonId,
    contentHash: document.contentHash,
    readerDocumentHash: academyReaderDocumentReviewHash(document),
    status: 'draft',
    personalStatus: 'not-reviewed',
    reviewedFields: [],
    sectionReviews: [],
    version,
    updatedAt: now,
  }
}

export function academyPersonalReviewStatus(
  document: AcademyReaderDocument,
  review: AcademyEditorialReview | undefined,
): AcademyPersonalReviewStatus | 'stale-after-content-change' {
  if (!review) return 'not-reviewed'
  if (review.contentHash !== document.contentHash || review.readerDocumentHash !== academyReaderDocumentReviewHash(document)) {
    return 'stale-after-content-change'
  }
  return review.personalStatus ?? (review.status === 'owner-reviewed' ? 'clear' : 'not-reviewed')
}

export function academyPersonalReviewStatusLabel(
  status: AcademyPersonalReviewStatus | 'stale-after-content-change',
): string {
  return {
    'not-reviewed': 'Todavía no has revisado esta lección',
    clear: 'La explicación te resulta clara',
    'needs-rework': 'Necesita ajustes para que te resulte clara',
    'stale-after-content-change': 'Tu revisión anterior quedó obsoleta tras cambiar el contenido',
  }[status]
}

export function academyEditorialStatusLabel(status: AcademyEditorialReviewStatus): string {
  const labels: Record<AcademyEditorialReviewStatus, string> = {
    'automated-structural-migration': 'Estructura generada automáticamente · pendiente de revisión',
    'codex-assisted-curation': 'Curación editorial aplicada · pendiente de tu revisión',
    'owner-review-pending': 'Pendiente de tu revisión',
    'owner-reviewed': 'Revisada por ti',
    'technical-expert-review-pending': 'Pendiente de revisión relojera',
    'technical-expert-reviewed': 'Revisada por especialista técnico',
    'stale-after-content-change': 'Tu revisión quedó desactualizada tras cambiar la lección',
  }
  return labels[status]
}

export type AcademyVisibleEditorialState =
  | AcademyReaderDocument['curation']['method']
  | 'owner-reviewed'
  | 'stale-after-content-change'

export function academyVisibleEditorialStatusLabel(status: AcademyVisibleEditorialState): string {
  return {
    'automated-structural-migration': 'Estructura generada automáticamente · pendiente de revisión',
    'codex-assisted-editorial-curation': 'Curación editorial aplicada · pendiente de tu revisión',
    'codex-assisted-personal-curation': 'Curación personal aplicada · pendiente de tu revisión',
    'owner-reviewed': 'Revisada por ti',
    'stale-after-content-change': 'Tu revisión quedó desactualizada tras cambiar la lección',
  }[status]
}
