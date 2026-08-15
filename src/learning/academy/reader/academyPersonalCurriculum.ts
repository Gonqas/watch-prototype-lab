/**
 * Fachada pública compatible para la curación personal versionada.
 * Los datos históricos de 0.14E y la capa activa se mantienen separados.
 */
export * from './personal'
export {
  academyPersonalActivityPresentation014H as academyPersonalActivityPresentation,
  academyPersonalPracticesForLesson014H as academyPersonalPracticesForLesson,
} from './personal/phase014h/stage2Registry'
export {
  ACADEMY_PERSONAL_REVIEW_QUEUE_014H as ACADEMY_PERSONAL_REVIEW_QUEUE,
  academyPersonalReviewQueue014HEntry as academyPersonalReviewQueueEntry,
} from './personal/phase014h/reviewQueue'
