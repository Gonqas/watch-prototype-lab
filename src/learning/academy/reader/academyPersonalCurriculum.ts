/**
 * Fachada pública compatible para la curación personal versionada.
 * Los datos históricos de 0.14E y la capa activa se mantienen separados.
 */
export * from './personal'
export {
  academyPersonalActivityPresentation014I as academyPersonalActivityPresentation,
  academyPersonalPracticesForLesson014I as academyPersonalPracticesForLesson,
} from './personal/phase014i/stage3Registry'
export {
  ACADEMY_PERSONAL_REVIEW_QUEUE_014I as ACADEMY_PERSONAL_REVIEW_QUEUE,
  academyPersonalReviewQueue014IEntry as academyPersonalReviewQueueEntry,
} from './personal/phase014i/reviewQueue'
