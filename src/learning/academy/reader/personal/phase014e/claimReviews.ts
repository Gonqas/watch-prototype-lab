import { academyPersonalSectionId as sectionId } from '../helpers'

export interface AcademyPersonalClaimReview {
  claimId: string
  lessonId: string
  sectionId: string
  claimType: 'principle' | 'identity' | 'calculation' | 'procedure' | 'diagnosis' | 'compatibility' | 'safety'
  generalOrCalibreSpecific: 'general' | 'calibre-specific'
  primarySourceId: string
  supportingSourceIds: string[]
  page: string | null
  figure: string | null
  table: string | null
  officialDocument: boolean
  verificationStatus: 'verified-primary' | 'verified-secondary' | 'visually-verified' | 'ocr-unverified' | 'inferred' | 'unknown' | 'requires-modern-corroboration'
  scope: string
  limitations: string[]
  decision: 'keep' | 'clarify' | 'narrow' | 'correct' | 'remove' | 'source-needed'
}

const claimReview = (
  claimId: string,
  lessonId: string,
  section: string,
  claimType: AcademyPersonalClaimReview['claimType'],
  generalOrCalibreSpecific: AcademyPersonalClaimReview['generalOrCalibreSpecific'],
  primarySourceId: string,
  decision: AcademyPersonalClaimReview['decision'],
  verificationStatus: AcademyPersonalClaimReview['verificationStatus'],
  scope: string,
  limitations: string[],
  supportingSourceIds: string[] = [],
  officialDocument = false,
): AcademyPersonalClaimReview => ({
  claimId, lessonId, sectionId: section, claimType, generalOrCalibreSpecific, primarySourceId,
  supportingSourceIds, page: null, figure: null, table: null, officialDocument,
  verificationStatus, scope, limitations, decision,
})

export const ACADEMY_PERSONAL_CLAIM_REVIEWS: readonly AcademyPersonalClaimReview[] = [
  claimReview('claim.horology.watch-functional-system', 'lesson.horology.system', sectionId('block.horology.system', 'explicacion-principal'), 'principle', 'general', 'source.horology.original-functional-map', 'keep', 'inferred', 'Mapa funcional educativo de un reloj completo.', ['No es una taxonomía de fabricante ni una geometría universal.']),
  claimReview('claim.miyota.8215.documented-parts', 'lesson.horology.mechanical-chain', sectionId('block.horology.mechanical-chain', 'explicacion-principal'), 'identity', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'narrow', 'verified-primary', 'Identidad y agrupación de componentes visibles en el despiece 8215.', ['El despiece no demuestra la cadena cinemática completa ni orden de servicio.'], ['source.horology.private-book.functional-systems'], true),
  claimReview('claim.horology.functional-equivalence-limited', 'lesson.horology.functional-equivalence', sectionId('block.horology.functional-equivalence', 'explicacion-principal'), 'principle', 'general', 'source.horology.original-functional-map', 'keep', 'inferred', 'Comparación de funciones entre cuarzo y mecánico.', ['Una función análoga no implica identidad física ni compatibilidad.']),
  claimReview('claim.horology.symbolic-interruption', 'lesson.horology.failure-prediction', sectionId('block.horology.failure-prediction', 'explicacion-principal'), 'diagnosis', 'general', 'source.horology.original-functional-map', 'clarify', 'inferred', 'Razonamiento causal dentro de una simulación.', ['La interrupción simbólica no diagnostica una unidad física.']),
  claimReview('claim.mechanical.theory.energy', 'lesson.mechanical.energy', sectionId('block.mechanical.theory.energy', 'teoria-almacenar-entregar-y-dosificar'), 'principle', 'general', 'source.horology.private-book.mainsprings', 'clarify', 'unknown', 'Energía, par y entrega en una arquitectura mecánica general.', ['Falta localizador de página para elevar detalles cuantitativos; el modelo permanece cualitativo.'], ['source.horology.original-mechanical-foundations']),
  claimReview('claim.mechanical.barrel', 'lesson.mechanical.barrel', sectionId('block.mechanical.barrel', 'modelo-causal-ampliado'), 'principle', 'general', 'source.horology.private-book.mainsprings', 'clarify', 'unknown', 'Funciones generales de árbol, muelle y tambor.', ['No prescribe apertura, lubricación, ganchos ni brida de un calibre concreto.']),
  claimReview('claim.mechanical.gear-pair', 'lesson.mechanical.gear-pair', sectionId('block.mechanical.gear-pair', 'explicacion'), 'calculation', 'general', 'source.horology.private-book.wheels-pinions', 'clarify', 'unknown', 'Relación ideal y sentido de un engrane externo declarado.', ['No valida módulo, perfil, depthing, eficiencia ni geometría fabricable.']),
  claimReview('claim.mechanical.theory.train', 'lesson.mechanical.train', sectionId('block.mechanical.theory.train', 'relacion-de-una-etapa'), 'calculation', 'general', 'source.horology.private-book.wheels-pinions', 'clarify', 'unknown', 'Producto de relaciones ideales en un tren declarado.', ['No atribuye conteos ni dimensiones al 8215.'], ['source.horology.private-book.movement-design']),
  claimReview('claim.mechanical.theory.escapement', 'lesson.mechanical.escapement', sectionId('block.mechanical.theory.escapement', 'secuencia-causal-completa'), 'principle', 'general', 'source.horology.private-book.escapements', 'clarify', 'unknown', 'Fases funcionales del escape de áncora suizo.', ['No valida ángulos, draw, penetración, lubricación o ajuste de calibre.']),
  claimReview('claim.mechanical.theory.oscillator', 'lesson.mechanical.oscillator', sectionId('block.mechanical.theory.oscillator', 'frecuencia-alternancias-y-periodo'), 'calculation', 'general', 'source.horology.private-book.balance-spring', 'clarify', 'unknown', 'Definiciones de periodo, frecuencia, alternancia y amplitud.', ['El modelo no calcula marcha real ni regula una espiral física.']),
  claimReview('claim.metrology.observe-before-measuring.014e', 'lesson.metrology.observe-before-measuring', sectionId('block.metrology.observe-before-measuring', 'explicacion-paso-a-paso'), 'diagnosis', 'general', 'source.metrology.bipm.vim', 'keep', 'verified-primary', 'Separación entre observación, pregunta, magnitud, medida e incertidumbre.', ['La elección del instrumento sigue dependiendo de la característica y la decisión.'], ['source.metrology.bipm.gum'], true),
  claimReview('claim.miyota8215.architecture', 'lesson.miyota8215.architecture', sectionId('block.miyota8215.architecture', 'explicacion'), 'identity', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'narrow', 'verified-primary', 'Nombres, presencia, agrupación y posición relativa aproximada de piezas 8215.', ['El fixture no expresa dimensiones, holguras, desgaste, lubricación ni servicio.'], ['source.miyota.8215.product-page'], true),
  claimReview('claim.miyota8215.guided-disassembly', 'lesson.miyota8215.guided-disassembly', sectionId('block.miyota8215.guided-disassembly', 'explicacion'), 'procedure', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'correct', 'verified-primary', 'Dependencias estructurales visibles entre fijaciones y subconjuntos.', ['No existe fuente suficiente para presentar una secuencia completa de desmontaje.'], ['source.miyota.8215.instruction-manual'], true),
  claimReview('claim.miyota8215.inspection', 'lesson.miyota8215.inspection', sectionId('block.miyota8215.inspection', 'explicacion'), 'diagnosis', 'calibre-specific', 'source.miyota.8215.parts-list-exploded-view', 'narrow', 'verified-primary', 'Identidad y localización de piezas que pueden convertirse en objeto de inspección.', ['La documentación y el modelo no demuestran desgaste, suciedad real ni tolerancia.'], [], true),
  claimReview('claim.encyclopedia.cases-water.arquitectura-de-caja', 'lesson.encyclopedia.cases-water.arquitectura-de-caja', sectionId('block.encyclopedia.cases-water.arquitectura-de-caja', 'resultado-buscado-y-condicion-segura'), 'compatibility', 'general', 'source.private.daniels.casemaking', 'clarify', 'unknown', 'Interfaces generales de caja y encaje; aplicación concreta mediante documentación de movimiento y medidas propias.', ['El capítulo no es documentación de un calibre; las especificaciones MIYOTA solo se aplican a su variante.'], ['source.official.miyota.2035', 'source.official.miyota.8215']),
  claimReview('claim.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', sectionId('block.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste', 'caracteristica-que-se-quiere-fabricar'), 'compatibility', 'general', 'source.private.daniels.small-components', 'source-needed', 'unknown', 'Relaciones geométricas generales de tubos, agujas y cadena axial.', ['Diámetros, alturas, interferencias y método de ajuste requieren documento de variante o medición verificada.'], ['source.official.miyota.2035', 'source.official.miyota.8215']),
  claimReview('claim.encyclopedia.service-tribology.limpieza-e-inspeccion', 'lesson.encyclopedia.service-tribology.limpieza-e-inspeccion', sectionId('block.encyclopedia.service-tribology.limpieza-e-inspeccion', 'de-la-observacion-a-la-prueba-discriminante'), 'diagnosis', 'general', 'source.institutional.awci.standards', 'clarify', 'verified-secondary', 'Separar observación, hipótesis y prueba reversible.', ['El visual no prescribe sustancias ni convierte una huella en diagnóstico.']),
  claimReview('claim.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control', sectionId('block.encyclopedia.service-tribology.montaje-y-puntos-de-control', 'secuencia-controles-y-puntos-de-parada'), 'procedure', 'general', 'source.institutional.awci.standards', 'narrow', 'verified-secondary', 'Patrón funcional de montaje con control y parada.', ['No es una secuencia de montaje del 8215 ni define tolerancias.'], ['source.official.miyota.8215']),
  claimReview('claim.encyclopedia.history-language.leer-documentacion', 'lesson.encyclopedia.history-language.leer-documentacion', sectionId('block.encyclopedia.history-language.leer-documentacion', 'cambio-continuidad-y-consecuencia'), 'identity', 'general', 'source.official.miyota.8215', 'keep', 'verified-primary', 'Método para distinguir documento, revisión, variante y alcance.', ['No presupone equivalencia entre revisiones ni familias.'], ['source.official.miyota.2035'], true),
  claimReview('claim.encyclopedia.service-tribology.diagnostico-y-control-final', 'lesson.encyclopedia.service-tribology.diagnostico-y-control-final', sectionId('block.encyclopedia.service-tribology.diagnostico-y-control-final', 'de-la-observacion-a-la-prueba-discriminante'), 'diagnosis', 'general', 'source.institutional.awci.standards', 'clarify', 'verified-secondary', 'Control final derivado de la hipótesis y del resultado esperado.', ['Los criterios numéricos siguen ligados al calibre y a la fuente aplicable.']),
  claimReview('claim.encyclopedia.service-tribology.recepcion-y-linea-base', 'lesson.encyclopedia.service-tribology.recepcion-y-linea-base', sectionId('block.encyclopedia.service-tribology.recepcion-y-linea-base', 'secuencia-controles-y-puntos-de-parada'), 'procedure', 'general', 'source.institutional.awci.standards', 'keep', 'verified-secondary', 'Registro del estado inicial antes de pruebas que puedan alterarlo.', ['No prescribe un protocolo comercial ni una prueba universal.']),
  claimReview('claim.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas', sectionId('block.encyclopedia.service-tribology.tm-diagnostico-sintomas', 'de-la-observacion-a-la-prueba-discriminante'), 'diagnosis', 'general', 'source.official.tm9-1575.diagnosis', 'narrow', 'requires-modern-corroboration', 'Patrón histórico de síntoma, hipótesis y comprobación.', ['Sustancias, intervalos, tolerancias y procedimientos históricos no se trasladan.'], ['source.private.chicago.35']),
  claimReview('claim.encyclopedia.service-tribology.tribologia-y-lubricantes', 'lesson.encyclopedia.service-tribology.tribologia-y-lubricantes', sectionId('block.encyclopedia.service-tribology.tribologia-y-lubricantes', 'secuencia-controles-y-puntos-de-parada'), 'procedure', 'calibre-specific', 'source.institutional.awci.standards', 'source-needed', 'requires-modern-corroboration', 'Relación general entre contacto, función y decisión de lubricación.', ['Producto, punto y cantidad necesitan documentación moderna del calibre; el 8215 público no los aporta.'], ['source.official.miyota.8215']),
  claimReview('claim.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', sectionId('block.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza', 'secuencia-controles-y-puntos-de-parada'), 'safety', 'general', 'source.institutional.awci.standards', 'clarify', 'requires-modern-corroboration', 'Fuentes y rutas de transferencia de contaminación en el banco.', ['No prescribe química; cualquier procedimiento histórico requiere seguridad moderna.'], ['source.private.daniels.workshop-equipment']),
] as const


