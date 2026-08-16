/**
 * Fachada pública compatible para la curación personal versionada.
 * Los datos históricos de 0.14E y la capa activa se mantienen separados.
 */
export * from './personal'
export { academyPersonalActivityPresentation014J as academyPersonalActivityPresentation, academyPersonalPracticesForLesson014J as academyPersonalPracticesForLesson } from './personal/phase014j/stage4Registry'
export { ACADEMY_PERSONAL_REVIEW_QUEUE_014J as ACADEMY_PERSONAL_REVIEW_QUEUE, academyPersonalReviewQueue014JEntry as academyPersonalReviewQueueEntry } from './personal/phase014j/reviewQueue'
