/**
 * Fachada pública compatible para la curación personal versionada.
 * Los datos históricos de 0.14E y la capa activa se mantienen separados.
 */
export * from './personal'
export { academyPersonalActivityPresentation014K as academyPersonalActivityPresentation, academyPersonalPracticesForLesson014K as academyPersonalPracticesForLesson } from './personal/phase014k/stage5Registry'
export { ACADEMY_PERSONAL_REVIEW_QUEUE_014K as ACADEMY_PERSONAL_REVIEW_QUEUE, academyPersonalReviewQueue014KEntry as academyPersonalReviewQueueEntry } from './personal/phase014k/reviewQueue'
