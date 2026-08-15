import { academyReaderStableHash } from '../../academyReaderIdentity'
import type { AcademySourceLocator, AcademyStage2ClaimReview, AcademyStage2FormulaReview } from '../types'
import { ACADEMY_PILOT_FORMULA_REVIEWS } from '../phase014e/formulaReviews'

const toh = (chapter: 'ch04' | 'ch05' | 'ch06' | 'ch07' | 'ch08' | 'ch09', page: string, figure?: string): AcademySourceLocator => ({
  sourceId: `source.private.toh.${chapter}`,
  documentLocator: `reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ${chapter === 'ch04' || chapter === 'ch05' ? 'ch 4&5' : `ch ${chapter.slice(2)}`}.pdf`,
  page, ...(figure ? { figure } : {}), verificationMethod: 'visual-pdf-inspection', verifiedAt: '2026-08-15',
})

const claim = (claimId: string, lessonId: string, text: string, locator: AcademySourceLocator, applicability: string, limitations: readonly string[] = []): AcademyStage2ClaimReview => ({
  claimId, lessonId, sectionId: `reader.section.${lessonId.replace('lesson.', 'block.')}.014h-modelo-causal`, claim: text,
  claimHash: academyReaderStableHash(text), claimType: 'mechanism', technicalStatus: 'source-reviewed', sourceIds: [locator.sourceId], locators: [locator],
  verificationStatus: 'visually-verified', applicability, sourceAuthority: 'conceptual-primary', limitations,
})

export const ACADEMY_STAGE_2_CLAIM_REVIEWS: readonly AcademyStage2ClaimReview[] = [
  claim('claim.014h.energy.storage-delivery', 'lesson.mechanical.energy', 'El muelle real almacena energía y el barrilete transmite par al tren durante la marcha.', toh('ch04','PDF 2 / impresa 46','Fig. 4-4'), 'Arquitectura mecánica general.', ['No cuantifica reserva, potencia o pérdidas.']),
  claim('claim.014h.barrel.parts', 'lesson.mechanical.barrel', 'Tambor, muelle, árbol y tapa cumplen funciones diferenciadas en el conjunto del barrilete.', toh('ch04','PDF 2 / impresa 46','Fig. 4-4'), 'Barrilete convencional descrito por la fuente.', ['No prescribe apertura o lubricación.']),
  claim('claim.014h.gears.pitch-circles', 'lesson.mechanical.gear-pair', 'Dos ruedas dentadas compatibles transmiten movimiento mediante sus círculos primitivos conceptuales.', toh('ch05','PDF 9 / impresa 53','Fig. 5-10'), 'Modelo geométrico ideal.', ['No verifica depthing o perfil real.']),
  claim('claim.014h.train.intermediate', 'lesson.mechanical.train', 'Un tren intermedio enlaza ejes sucesivos mediante pares de engrane.', toh('ch05','PDF 12 / impresa 56','Figs. 5-14 y 5-15'), 'Trenes de ruedas convencionales.', ['No representa la planta de un calibre.']),
  claim('claim.014h.train.motion-branch', 'lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren', 'La minutería constituye una rama de indicación distinta de la transmisión hacia el escape.', toh('ch05','PDF 18 / impresa 62','Fig. 5-26'), 'Arquitectura funcional general.', ['La disposición concreta varía.']),
  claim('claim.014h.escapement.components', 'lesson.mechanical.escapement', 'Rueda de escape, áncora con paletas y rodillo forman interfaces del escape de áncora suizo.', toh('ch06','PDF 3 / impresa 101','Figs. 6-6 y 6-7'), 'Escape de áncora suizo.', ['No se generaliza a otros escapes.']),
  claim('claim.014h.escapement.sequence', 'lesson.encyclopedia.escapements-chronometry.toh-escape-fases', 'El ciclo funcional distingue bloqueo, desbloqueo, impulso y seguridad.', toh('ch06','PDF 8 / impresa 106','Tabla 6.3.1'), 'Escape de áncora suizo.', ['Los ángulos de la tabla no se importan.']),
  claim('claim.014h.oscillator.parts', 'lesson.mechanical.oscillator', 'Volante y espiral forman un oscilador en el que inercia y retorno elástico tienen funciones diferentes.', toh('ch07','PDF 5 / impresa 133','Figs. 7-8 a 7-10'), 'Órgano regulador mecánico descrito.', ['No predice marcha real.']),
  claim('claim.014h.oscillator.feedback', 'lesson.mechanical.escape-oscillator', 'El escape entrega impulso al oscilador y el oscilador determina momentos de liberación del escape.', toh('ch06','PDF 8 / impresa 106'), 'Modelo funcional del escape de áncora.', ['No simula fuerzas.']),
  claim('claim.014h.motion-works.indication', 'lesson.mechanical.motion-works', 'La minutería transmite la puesta en hora hacia las indicaciones de minutos y horas.', toh('ch05','PDF 18 / impresa 62','Fig. 5-26'), 'Tren de puesta en hora representado por la fuente.', ['No prescribe ajuste de agujas.']),
  claim('claim.014h.keyless.selection', 'lesson.mechanical.keyless', 'La posición de la tija selecciona una ruta funcional de mando.', toh('ch05','PDF 18 / impresa 62','Fig. 5-26'), 'Principio general de puesta en hora.', ['Las posiciones y piezas dependen del calibre.']),
  claim('claim.014h.automatic.rotor', 'lesson.encyclopedia.complications.automatico-y-reserva', 'Una masa oscilante transmite movimiento hacia el muelle mediante un tren de reducción.', toh('ch08','PDF 3 / impresa 171','Figs. 8-6 y 8-7'), 'Sistema automático general.', ['No afirma sentido, eficiencia o reserva.']),
  claim('claim.014h.calendar.date-train', 'lesson.encyclopedia.complications.calendarios', 'La rueda de horas puede activar un tren de fecha que produce un avance diario discreto.', toh('ch09','PDF 3 / impresa 191','Fig. 9-5'), 'Calendario de fecha simple descrito.', ['No define ventana segura de corrección.']),
  claim('claim.014h.stage2.functional-chain', 'lesson.mechanical.automatic-calendar', 'Automático y calendario son ampliaciones de entrada y salida sobre la cadena mecánica básica.', toh('ch08','PDF 3 / impresa 171'), 'Clasificación curricular conceptual.', ['La relación es editorial y no afirma una arquitectura única.']),
  claim('claim.014h.calendar.discrete-state', 'lesson.advanced.calendars', 'Un calendario más complejo necesita representar estados o ciclos adicionales respecto a una fecha simple.', toh('ch09','PDF 3 / impresa 191'), 'Comparación conceptual.', ['Los mecanismos concretos siguen source-limited.']),
] as const

export const ACADEMY_STAGE_2_FORMULA_REVIEWS: readonly AcademyStage2FormulaReview[] = [
  ...ACADEMY_PILOT_FORMULA_REVIEWS.map((item) => ({
    formulaId: item.formulaId, lessonId: item.lessonId, expression: item.expression, decision: 'reused-verified' as const,
    sourceId: item.sourceId, reason: `Revisión 0.14E conservada: ${item.limitations.join(' ')}`,
  })),
  { formulaId: 'formula.014h.daniels-mainspring', lessonId: 'lesson.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete', expression: 'no publicada', decision: 'not-used', sourceId: 'source.private.daniels.mainsprings', reason: 'La fuente OCR no se verificó visualmente para una fórmula concreta.' },
  { formulaId: 'formula.014h.daniels-gear-geometry', lessonId: 'lesson.encyclopedia.mechanical-energy-trains.toh-engranaje-geometria', expression: 'no publicada', decision: 'not-used', sourceId: 'source.private.daniels.wheels-pinions', reason: 'No se transfiere geometría de fabricación desde OCR.' },
  { formulaId: 'formula.014h.daniels-escapement', lessonId: 'lesson.encyclopedia.escapements-chronometry.geometria-del-escape', expression: 'no publicada', decision: 'not-used', sourceId: 'source.private.daniels.escapements', reason: 'Ángulos y tablas de escape requieren verificación visual y aplicabilidad.' },
  { formulaId: 'formula.014h.daniels-balance', lessonId: 'lesson.encyclopedia.math-physics-metrology.oscilacion-amortiguamiento', expression: 'no publicada', decision: 'not-used', sourceId: 'source.private.daniels.balance-spring', reason: 'No se presenta una fórmula OCR como relación verificada.' },
] as const
