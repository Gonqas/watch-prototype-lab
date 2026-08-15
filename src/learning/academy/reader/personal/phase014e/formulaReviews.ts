export interface AcademyPilotFormulaReview {
  formulaId: string
  lessonId: string
  expression: string
  ocrDerived: false
  sourceId: string
  status: 'verified-with-secondary-source'
  limitations: string[]
}

export const ACADEMY_PILOT_FORMULA_REVIEWS: readonly AcademyPilotFormulaReview[] = [
  { formulaId: 'formula.014e.gear-pair-ratio', lessonId: 'lesson.mechanical.gear-pair', expression: 'n₂/n₁ = Z₁/Z₂ para el par ideal declarado', ocrDerived: false, sourceId: 'source.horology.private-book.wheels-pinions', status: 'verified-with-secondary-source', limitations: ['No expresa pérdidas, perfil, depthing ni resistencia.'] },
  { formulaId: 'formula.014e.train-product', lessonId: 'lesson.mechanical.train', expression: 'i_total = producto de las relaciones de etapa declaradas', ocrDerived: false, sourceId: 'source.horology.private-book.wheels-pinions', status: 'verified-with-secondary-source', limitations: ['Solo se aplica a las etapas y signos definidos en el ejercicio.'] },
  { formulaId: 'formula.014e.oscillator-period', lessonId: 'lesson.mechanical.oscillator', expression: 'T = 1/f', ocrDerived: false, sourceId: 'source.horology.private-book.balance-spring', status: 'verified-with-secondary-source', limitations: ['Relación definitoria; no calcula marcha real.'] },
  { formulaId: 'formula.014e.oscillator-alternations', lessonId: 'lesson.mechanical.oscillator', expression: 'alternancias por hora = 2 · f · 3600', ocrDerived: false, sourceId: 'source.horology.private-book.balance-spring', status: 'verified-with-secondary-source', limitations: ['f se expresa en ciclos por segundo; no sustituye la especificación del calibre.'] },
] as const


