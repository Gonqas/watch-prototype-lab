# Registro canónico de fuentes de la Academia

Versión del esquema: `wplab-academy-source-registry-v1`  
Fase: **0.14A**  
Huella del corpus: `1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e`  
Registros: **189**

Este registro conserva metadatos, autoridad, alcance, riesgos, localizadores y política de reutilización. No incorpora páginas, escaneos, imágenes ni fragmentos extensos de los originales.

## Funciones editoriales

| Código | Familia | Uso autorizado | Límite |
|---|---|---|---|
| A | Documentación oficial de fabricante | Autoridad prioritaria para el calibre concreto: dimensiones, referencias, piezas, secuencias, lubricación, tolerancias y datos de servicio. | No funciona como teoría relojera general. |
| B | Theory of Horology | Fuente conceptual principal para funcionamiento general, física, arquitectura, engranajes, energía, escape, regulación y complicaciones. | No funciona como manual específico de servicio de un calibre. |
| C | Horologia completa / George Daniels - Watchmaking | Fuente principal para fabricación, geometría, torno, ruedas, piñones, pequeños componentes, rubíes, escapes, diseño, cajas y esferas. | OCR de fórmulas, tablas y símbolos exige verificación visual; riesgos históricos requieren corroboración moderna. |
| D | Bulova School of Watch Making | Fuente principal para progresión psicomotriz, herramientas, repetición, micromecánica y pasaportes de habilidad. | No es autoridad moderna de productos químicos o seguridad. |
| E | Chicago School of Watchmaking | Fuente principal para hojas de trabajo, procedimientos, secuencias, ejercicios y preguntas de repaso. | Procedimientos químicos/térmicos históricos no son accionables; respuestas no se importan automáticamente. |
| F | TM 9-1575 | Fuente principal para inspección, diagnóstico, observación antes de desmontar, hipótesis y comprobación. | Tolerancias, sustancias, intervalos y procedimientos específicos son históricos salvo corroboración. |
| G | Webs de relojeros y recursos visuales | Casos reales, defectos, fotografías, restauraciones y transferencia entre calibres. | Un caso particular no se generaliza. |
| H | Bases de datos | Identificación, familias, equivalencias, fechas y descubrimiento. | No son fuente final de lubricación, tolerancias, compatibilidad o servicio. |

## Integridad de originales locales

| Archivo | Estado | Bytes | Páginas verificadas | SHA-256 |
|---|---|---:|---:|---|
| Chicago CD.iso | accesible | 93937664 | — | `a969f30e81e355ad7e000b012a9a7e612d43e86c64eac179788188327cdccdfa` |
| Horologia_completa_OCR_ligera_100MB.pdf | accesible | 94254044 | 425 | `78cb0b2931e256f42e6f2843c21be86e47762c0e53f755eef04c86c798e348b2` |
| horologia_sistema4b_blueprint_v0.1.zip | accesible | 14612 | — | `a40203a87ada498abed64edabcfec720051b9ef7cba6feda30ef5296ae69e6aa` |
| Joseph Bulova School of Watch Making.pdf | accesible | 52593290 | 283 | `b13229157e4839d81285d9069f991f6e8c85c59536955f562298bffb7fe2c981` |
| Theory of Horology-20260809T132232Z-1-001.zip | accesible | 329877428 | — | `b7b4fc26221673823fab035236fef04298a000d123287dc6e1ada99215187935` |
| TM 9-1575.pdf | accesible | 14937992 | 227 | `6277f0e31ab6d94a576a811afb6d6bdce8c631013355215bc46b1ea8de42af08` |
| VBAUhrentechnik.zip | accesible | 6052947 | — | `67324954824f482958a0bf6e0fcd3598dd3567d0ad010299476192fb103ecf8c` |

Los originales permanecen bajo `reference-library/originals/` y Git LFS. Cualquier extracción de auditoría se limita a `.cache/reference-audit/`, ignorada por Git.

## Registros

| sourceId | Título | Función | Verificación | Precisión | Lecciones | Corroboración moderna | Localizador |
|---|---|---|---|---|---:|---|---|
| `source.cepeda.2008` | Cepeda et al. (2008) · spacing effects | G-watchmaker-or-visual-resource | verified-secondary | document | 0 | sí | https://pubmed.ncbi.nlm.nih.gov/19076480/ |
| `source.encyclopedia.original-synthesis` | Síntesis educativa original de Watchmaking Academy | project-original | verified-secondary | missing | 76 | no | unresolved:source.encyclopedia.original-synthesis |
| `source.eta.2824-2.product` | ETA 2824-2 product page | A-manufacturer-official | verified-primary | document | 6 | no | https://portal.eta.ch/en/mecaline/2824-2-2824-2-5.html |
| `source.eta.6497-2.communication` | ETA 6497-2 · comunicación técnica | A-manufacturer-official | verified-primary | document | 13 | no | https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/ |
| `source.eta.6497-2.product` | ETA 6497-2 product page | A-manufacturer-official | verified-primary | document | 2 | no | https://portal.eta.ch/fr/6497-2-6497-2-3.html |
| `source.eta.7750.communication` | ETA 7750 Technical Communication | A-manufacturer-official | verified-primary | document | 5 | no | https://portal.eta.ch/en/technicaldocuments/index/pdf/id/2180/ |
| `source.eta.7750.product` | ETA 7750 product page | A-manufacturer-official | verified-primary | document | 5 | no | https://portal.eta.ch/en/7750-7750-5.html |
| `source.external.17jewels` | 17jewels movement archive | H-reference-database | unknown | document | 5 | sí | https://17jewels.info/ |
| `source.external.animagraffs-mechanical-watch` | How a Mechanical Watch Works | G-watchmaker-or-visual-resource | unknown | document | 3 | sí | https://animagraffs.com/mechanical-watch/ |
| `source.external.ashton-tracy` | Ashton Tracy · Horological Insider | G-watchmaker-or-visual-resource | verified-secondary | document | 5 | sí | https://www.ashtontracy.ca/horological-insider |
| `source.external.bobinchak-school` | Watchmaking School From a Student's Perspective | G-watchmaker-or-visual-resource | verified-secondary | document | 3 | sí | https://www.bobinchak.com/ |
| `source.external.caliber-corner` | Caliber Corner | H-reference-database | unknown | document | 3 | sí | https://calibercorner.com/ |
| `source.external.ciechanowski-mechanical-watch` | Mechanical Watch | G-watchmaker-or-visual-resource | unknown | document | 10 | sí | https://ciechanow.ski/mechanical-watch/ |
| `source.external.dean-dk` | Dean DK · Traditional watchmaking project | G-watchmaker-or-visual-resource | unknown | document | 4 | sí | https://www.youtube.com/channel/UC8Fnh5V01lstObcmwpm3Akg |
| `source.external.eta-swisslab-6497` | ETA Swisslab · 6497 | A-manufacturer-official | verified-primary | document | 3 | no | https://www.eta.ch/swisslab/6497/6947.html |
| `source.external.hodinkee-watch101` | Hodinkee · Watch 101 | G-watchmaker-or-visual-resource | unknown | document | 9 | sí | https://www.hodinkee.com/watch101 |
| `source.external.horlogerie-suisse` | Horlogerie Suisse · Base de l'horlogerie | G-watchmaker-or-visual-resource | verified-secondary | document | 2 | sí | https://horlogerie-suisse.com/technique/base-de-l-horlogerie |
| `source.external.horology-student.books` | Horology Student · Books | G-watchmaker-or-visual-resource | unknown | document | 5 | sí | https://horology-student.org/resources/books/ |
| `source.external.horology-student.shops` | Horology Student · Shops | G-watchmaker-or-visual-resource | unknown | document | 0 | sí | https://horology-student.org/resources/shops/ |
| `source.external.jomashop-history` | A History of Horology, Clockmaking and Watches | G-watchmaker-or-visual-resource | unknown | document | 2 | sí | https://www.jomashop.com/blog/guides/a-history-of-horology-clockmaking-and-watches |
| `source.external.learnwatchmaking` | Learn Watchmaking | G-watchmaker-or-visual-resource | unknown | document | 1 | sí | https://learnwatchmaking.com/ |
| `source.external.naked-watchmaker` | The Naked Watchmaker | G-watchmaker-or-visual-resource | verified-secondary | document | 10 | sí | https://www.thenakedwatchmaker.com/ |
| `source.external.pocket-watch-database` | Pocket Watch Database | H-reference-database | unknown | document | 6 | sí | https://pocketwatchdatabase.com/ |
| `source.external.pocketwatchdatabase` | Pocket Watch Database | H-reference-database | unknown | document | 1 | sí | https://pocketwatchdatabase.com/ |
| `source.external.ranfft` | Ranfft Watches and Movements | H-reference-database | unknown | document | 7 | sí | http://www.ranfft.de/cgi-bin/bidfun-db.cgi?10&ranfft&&2uswk |
| `source.external.timezone-horologium` | TimeZone · The Horologium archives | G-watchmaker-or-visual-resource | verified-secondary | document | 1 | sí | https://www.timezone.com/category/library/the-horologium/ |
| `source.external.timezone-illustrated-glossary` | TimeZone Watch School · Illustrated Glossary of Watch Parts | G-watchmaker-or-visual-resource | verified-secondary | document | 6 | sí | https://www.timezonewatchschool.com/WatchSchool/Glossary/glossary.shtml |
| `source.external.watch-movements-eu` | Watch movements · A passion | G-watchmaker-or-visual-resource | verified-secondary | document | 3 | sí | https://watch-movements.eu/blog/en/ |
| `source.external.watchbase` | WatchBase | H-reference-database | unknown | document | 3 | sí | https://www.watchbase.com/ |
| `source.external.watchguy` | The Watch Guy repair archive | G-watchmaker-or-visual-resource | verified-secondary | document | 4 | sí | https://watchguy.co.uk/ |
| `source.external.watchguy-manuals` | Watch Guy · Technical Instructions / Service Manuals | H-reference-database | unknown | document | 9 | sí | https://watchguy.co.uk/technical-instructions-service-manuals/ |
| `source.external.watchguy-repair-blog` | Watch Guy · Watch repair blog | G-watchmaker-or-visual-resource | verified-secondary | document | 8 | sí | https://watchguy.co.uk/ |
| `source.external.worn-wound-caliber-spec` | Worn & Wound · Caliber Spec | G-watchmaker-or-visual-resource | unknown | document | 1 | sí | https://wornandwound.com/caliber-spec-eta-2824-rivals-clones/ |
| `source.horology.original-functional-map` | Blueprint editorial · primer módulo funcional | project-original | inferred | missing | 6 | no | unresolved:source.horology.original-functional-map |
| `source.horology.original-mechanical-foundations` | Sistema 4E · Fundamentos del reloj mecánico | project-original | inferred | missing | 12 | no | unresolved:source.horology.original-mechanical-foundations |
| `source.horology.original-miyota8215` | Sistema 4F · MIYOTA 8215 completo | project-original | inferred | missing | 15 | no | unresolved:source.horology.original-miyota8215 |
| `source.horology.original-quartz-practical-route` | Sistema 4D · ruta práctica Del ISA 8172 al MIYOTA 2035 | project-original | inferred | missing | 10 | no | unresolved:source.horology.original-quartz-practical-route |
| `source.horology.private-book.balance-spring` | Libro privado de teoría relojera · The Balance and Spring | other | unknown | chapter-or-section | 2 | sí | capítulo 11 · PDF pp. 336–370 verificadas; inicio visual en p. 336 |
| `source.horology.private-book.escapements` | Libro privado de teoría relojera · Escapements | other | unknown | chapter-or-section | 2 | sí | capítulo 8 · PDF pp. 214–271 verificadas; inicio visual en p. 214 |
| `source.horology.private-book.functional-systems` | Libro privado de teoría relojera · sistemas funcionales | other | unknown | chapter-or-section | 2 | sí | unresolved:source.horology.private-book.functional-systems |
| `source.horology.private-book.jewelling` | Libro privado de teoría relojera · Jewelling | other | unknown | chapter-or-section | 1 | sí | capítulo 7 · PDF pp. 195–213 verificadas; inicio visual en p. 195 |
| `source.horology.private-book.mainsprings` | Libro privado de teoría relojera · Mainsprings and Accessories | other | unknown | chapter-or-section | 3 | sí | capítulo 9 · PDF pp. 272–297 verificadas; inicio visual en p. 272 |
| `source.horology.private-book.movement-design` | Libro privado de teoría relojera · Movement Design | other | unknown | chapter-or-section | 5 | sí | capítulo 10 · PDF pp. 298–335 verificadas; inicio visual en p. 298 |
| `source.horology.private-book.wheels-pinions` | Libro privado de teoría relojera · Wheels and Pinions | other | unknown | chapter-or-section | 4 | sí | capítulo 5 · PDF pp. 124–167 verificadas; inicio visual en p. 124 |
| `source.institutional.awci.standards` | AWCI Official Standards and Practices for Watchmakers | G-watchmaker-or-visual-resource | verified-secondary | document | 19 | sí | https://www.awci.com/wp-content/uploads/2011/07/AWCI-standards-practicese.pdf |
| `source.institutional.wostep.watchmaker` | WOSTEP Watchmaker I+II+III programme | G-watchmaker-or-visual-resource | verified-secondary | document | 10 | sí | https://www.wostep.ch/sites/default/files/2025-12/P05-Watchmaker_brochure_en.pdf |
| `source.iso.1101` | ISO 1101:2017 · especificación geométrica | other | verified-secondary | document | 8 | sí | https://www.iso.org/standard/66777.html |
| `source.iso.14253-1` | ISO 14253-1:2017 · decisión de conformidad | other | verified-secondary | document | 5 | sí | https://www.iso.org/standard/70137.html |
| `source.iso.14856` | ISO 14856:2001 · correas no metálicas | other | verified-secondary | document | 1 | sí | https://www.iso.org/standard/22479.html |
| `source.iso.21920-1` | ISO 21920-1:2021 · textura superficial | other | verified-secondary | document | 5 | sí | https://www.iso.org/standard/72196.html |
| `source.iso.22810` | ISO 22810:2010 · resistencia al agua | other | verified-secondary | document | 2 | sí | https://www.iso.org/standard/45334.html |
| `source.iso.286-1` | ISO 286-1:2010 · tolerancias y ajustes | other | verified-secondary | document | 4 | sí | https://www.iso.org/standard/45975.html |
| `source.iso.3160-2` | ISO 3160-2:2015 · recubrimientos de aleación de oro | other | verified-secondary | document | 1 | sí | https://committee.iso.org/standard/66162.html |
| `source.iso.9241-11` | ISO 9241-11:2018 · usabilidad | other | verified-secondary | document | 2 | sí | https://www.iso.org/standard/63500.html |
| `source.iso.9241-210` | ISO 9241-210:2019 · diseño centrado en las personas | other | verified-secondary | document | 2 | sí | https://www.iso.org/standard/77520.html |
| `source.metrology.bipm.gum` | JCGM 100:2008 · Guide to the expression of uncertainty in measurement | other | unknown | document | 14 | sí | https://www.bipm.org/documents/20126/2071204/JCGM_100_2008_E.pdf |
| `source.metrology.bipm.vim` | JCGM 200:2012 · Vocabulario Internacional de Metrología | other | unknown | document | 14 | sí | https://www.bipm.org/en/doi/10.59161/jcgm200-2012 |
| `source.metrology.nist.handbook` | NIST/SEMATECH e-Handbook of Statistical Methods · Measurement Process Characterization | other | unknown | document | 14 | sí | https://www.itl.nist.gov/div898/handbook/mpc/mpc.htm |
| `source.metrology.original-course` | Síntesis original del Sistema 5A | project-original | inferred | missing | 14 | no | unresolved:source.metrology.original-course |
| `source.miyota.2035.drawing` | MIYOTA 2035 · drawing | A-manufacturer-official | verified-primary | document | 7 | no | https://miyotamovement.com/uploads/product/product_4tdsbpNVQi1WcE5lUw.pdf |
| `source.miyota.2035.instruction-manual` | MIYOTA 2035 · instruction manual | A-manufacturer-official | verified-primary | document | 7 | no | https://miyotamovement.com/uploads/product/product_cKAJDxu3CLoa18GHXO.pdf |
| `source.miyota.2035.official` | MIYOTA 2035 official documentation | A-manufacturer-official | verified-primary | document | 0 | no | https://miyotamovement.com/product/2035/ |
| `source.miyota.2035.parts-list-exploded-view` | MIYOTA 2035 · parts list and exploded view | A-manufacturer-official | verified-primary | document | 9 | no | https://miyotamovement.com/uploads/product/product_j6P3s1O5naNRxHZWMK.pdf |
| `source.miyota.2035.product-page` | MIYOTA 2035 · página oficial | A-manufacturer-official | verified-primary | document | 8 | no | https://miyotamovement.com/product/2035/ |
| `source.miyota.2035.specification` | MIYOTA 2035 · specification | A-manufacturer-official | verified-primary | document | 7 | no | https://miyotamovement.com/uploads/product/product_pgSIG6yWb0akqcUhDf.pdf |
| `source.miyota.8215.drawing` | MIYOTA 8215 · drawing | A-manufacturer-official | verified-primary | document | 15 | no | https://miyotamovement.com/uploads/product/product_LGuS8EY5DX03RiBaJH.pdf |
| `source.miyota.8215.instruction-manual` | MIYOTA 8215 · instruction manual | A-manufacturer-official | verified-primary | document | 15 | no | https://miyotamovement.com/uploads/product/product_mRAnUkS0wHFurpOK3T.pdf |
| `source.miyota.8215.official` | MIYOTA 8215 · documentación oficial | A-manufacturer-official | verified-primary | document | 11 | no | https://miyotamovement.com/product/8215/ |
| `source.miyota.8215.parts-list-exploded-view` | MIYOTA 8215 · parts list and exploded view | A-manufacturer-official | verified-primary | document | 16 | no | https://miyotamovement.com/uploads/product/product_x2MOZCosd7iH59wu0K.pdf |
| `source.miyota.8215.product-page` | MIYOTA 8215 · página oficial | A-manufacturer-official | verified-primary | document | 16 | no | https://miyotamovement.com/product/8215/ |
| `source.miyota.8215.specification` | MIYOTA 8215 · specification | A-manufacturer-official | verified-primary | document | 15 | no | https://miyotamovement.com/uploads/product/product_8jT5DEdzRXAsaSN2Bu.pdf |
| `source.niosh.machine-safety` | NIOSH · Machine Safety | other | verified-secondary | document | 1 | sí | https://www.cdc.gov/niosh/machine-safety/about/index.html |
| `source.niosh.metalworking-fluids` | NIOSH · Metalworking Fluids | other | verified-secondary | document | 0 | sí | https://www.cdc.gov/niosh/docs/98-116/default.html |
| `source.nist.human-centered-design` | NIST · Human Factors and Human-Centered Design | other | verified-secondary | document | 0 | sí | https://www.nist.gov/itl/iad/human-centered-technologies/human-factors-human-centered-design |
| `source.official.bipm.vim` | BIPM · International Vocabulary of Metrology | other | verified-secondary | document | 4 | sí | https://www.bipm.org/en/committees/jc/jcgm/publications |
| `source.official.eta.2824` | ETA 2824-2 · ficha oficial | A-manufacturer-official | verified-primary | document | 4 | no | https://portal.eta.ch/en/mecaline/2824-2-2824-2-5.html |
| `source.official.eta.6497` | ETA 6497-2 · Technical Communication | A-manufacturer-official | verified-primary | document | 1 | no | https://portal.eta.ch/en/technicaldocuments/index/pdf/id/1532/ |
| `source.official.eta.7750` | ETA 7750 · Technical Communication | A-manufacturer-official | verified-primary | document | 4 | no | https://portal.eta.ch/en/technicaldocuments/index/pdf/id/2180/ |
| `source.official.miyota.2035` | MIYOTA 2035 · documentación oficial | A-manufacturer-official | verified-primary | document | 11 | no | https://miyotamovement.com/product/2035/ |
| `source.official.miyota.8215` | MIYOTA 8215 · documentación oficial | A-manufacturer-official | verified-primary | document | 13 | no | https://miyotamovement.com/product/8215/ |
| `source.official.nist.uncertainty` | NIST · Uncertainty of Measurement | other | verified-secondary | document | 2 | sí | https://www.nist.gov/pml/nist-technical-note-1297 |
| `source.official.seiko.6138` | Seiko 6138A · Technical Guide | A-manufacturer-official | verified-primary | document | 3 | no | https://seikoserviceusa.com/uploads/datasheets/6138A.pdf |
| `source.official.tm9-1575.bulova-10ak` | War Department TM 9-1575 · Bulova 10AK waterproof wrist watch | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.official.tm9-1575.clock-m1` | War Department TM 9-1575 · Message Center Clock M1 | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.official.tm9-1575.diagnosis` | War Department TM 9-1575 · Troubleshooting, adjustment and repair | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.official.tm9-1575.elgin-waltham-pocket` | War Department TM 9-1575 · Elgin and Waltham pocket watches | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.official.tm9-1575.hamilton-992b` | War Department TM 9-1575 · Hamilton 992B | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.official.tm9-1575.inspection` | War Department TM 9-1575 · Inspection before disassembly and service records | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.official.tm9-1575.stopwatches` | War Department TM 9-1575 · Elgin stop watches | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.official.tm9-1575.wristwatches` | War Department TM 9-1575 · Hamilton, Elgin and Waltham wrist watches | F-tm-9-1575 | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.osha.metalworking-fluids` | OSHA · Metalworking Fluids | other | verified-secondary | document | 1 | sí | https://www.osha.gov/metalworking-fluids/manual |
| `source.private.bulova.01` | Joseph Bulova School of Watch Making · Staking balance staffs | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.02` | Joseph Bulova School of Watch Making · Truing balance wheels | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.03` | Joseph Bulova School of Watch Making · Basic turning | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.03a` | Joseph Bulova School of Watch Making · Turning balance staffs | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.03b` | Joseph Bulova School of Watch Making · Stem making | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.04` | Joseph Bulova School of Watch Making · Burnishing balance pivots | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.05` | Joseph Bulova School of Watch Making · Poising balance wheels | D-bulova-school | requires-modern-corroboration | page-or-figure | 2 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.06` | Joseph Bulova School of Watch Making · Hairspring truing | D-bulova-school | requires-modern-corroboration | page-or-figure | 2 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.07` | Joseph Bulova School of Watch Making · Hairspring vibration | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.08` | Joseph Bulova School of Watch Making · Overcoiling | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.09` | Joseph Bulova School of Watch Making · Watch assembly | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.09a` | Joseph Bulova School of Watch Making · Mainspring barrel assembly | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.09b` | Joseph Bulova School of Watch Making · Friction jeweling | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.10` | Joseph Bulova School of Watch Making · Escapement examination | D-bulova-school | requires-modern-corroboration | page-or-figure | 3 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.10a` | Joseph Bulova School of Watch Making · Escapement repair | D-bulova-school | requires-modern-corroboration | page-or-figure | 1 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.11` | Joseph Bulova School of Watch Making · Finishing | D-bulova-school | requires-modern-corroboration | page-or-figure | 0 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.additional` | Joseph Bulova School of Watch Making · Additional escapement supplements | D-bulova-school | requires-modern-corroboration | page-or-figure | 0 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.general-repair` | Joseph Bulova School of Watch Making · General repair information | D-bulova-school | requires-modern-corroboration | page-or-figure | 0 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.preliminary` | Joseph Bulova School of Watch Making · Preliminary training: finger dexterity | D-bulova-school | requires-modern-corroboration | page-or-figure | 2 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.supplement` | Joseph Bulova School of Watch Making · Escapement supplements | D-bulova-school | requires-modern-corroboration | page-or-figure | 0 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.bulova.volume` | Joseph Bulova School of Watch Making | D-bulova-school | requires-modern-corroboration | document | 0 | sí | reference-library/originals/Joseph Bulova School of Watch Making.pdf |
| `source.private.chicago.1` | Chicago School of Watchmaking · Fundamental principles, equipment and casing | E-chicago-school | requires-modern-corroboration | chapter-or-section | 2 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 1.PDF |
| `source.private.chicago.10` | Chicago School of Watchmaking · Cleaning | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 10.PDF |
| `source.private.chicago.11` | Chicago School of Watchmaking · Timing, rating and regulation | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 11.PDF |
| `source.private.chicago.12` | Chicago School of Watchmaking · Factory-set train jewels | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 12.PDF |
| `source.private.chicago.13` | Chicago School of Watchmaking · Balance hole and roller jewels | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 13.PDF |
| `source.private.chicago.14` | Chicago School of Watchmaking · Friction jeweling | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 14.PDF |
| `source.private.chicago.15` | Chicago School of Watchmaking · Replacing factory balance staffs | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 15.PDF |
| `source.private.chicago.16` | Chicago School of Watchmaking · Truing balances | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 16.PDF |
| `source.private.chicago.17` | Chicago School of Watchmaking · Poising balances | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 17.PDF |
| `source.private.chicago.18` | Chicago School of Watchmaking · Truing hairsprings | E-chicago-school | requires-modern-corroboration | chapter-or-section | 0 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 18.PDF |
| `source.private.chicago.19` | Chicago School of Watchmaking · Colleting hairsprings | E-chicago-school | requires-modern-corroboration | chapter-or-section | 0 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 19.PDF |
| `source.private.chicago.2` | Chicago School of Watchmaking · Crowns, stems, sleeves and bows | E-chicago-school | requires-modern-corroboration | chapter-or-section | 2 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 2.PDF |
| `source.private.chicago.20` | Chicago School of Watchmaking · Overcoil hairspring | E-chicago-school | requires-modern-corroboration | chapter-or-section | 0 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 20.PDF |
| `source.private.chicago.21` | Chicago School of Watchmaking · Lever escapement | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 21.PDF |
| `source.private.chicago.22` | Chicago School of Watchmaking · Lever escapement continued | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 22.PDF |
| `source.private.chicago.23` | Chicago School of Watchmaking · Types of escapements | E-chicago-school | requires-modern-corroboration | chapter-or-section | 0 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 23.PDF |
| `source.private.chicago.24` | Chicago School of Watchmaking · Drawing the lever escapement | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 24.PDF |
| `source.private.chicago.25` | Chicago School of Watchmaking · Drawing continued | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 25.PDF |
| `source.private.chicago.26` | Chicago School of Watchmaking · Matching the escapement | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 26.PDF |
| `source.private.chicago.27` | Chicago School of Watchmaking · Tools, hardening and tempering | E-chicago-school | requires-modern-corroboration | chapter-or-section | 0 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 27.PDF |
| `source.private.chicago.28` | Chicago School of Watchmaking · Lathe foundations | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 28.PDF |
| `source.private.chicago.29` | Chicago School of Watchmaking · Lathe work | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 29.PDF |
| `source.private.chicago.3` | Chicago School of Watchmaking · Fitting watch crystals and attachments | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 3.PDF |
| `source.private.chicago.30` | Chicago School of Watchmaking · Lathe work continued | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 30.PDF |
| `source.private.chicago.31` | Chicago School of Watchmaking · Advanced lathe work | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 31.PDF |
| `source.private.chicago.32a` | Chicago School of Watchmaking · Fitting hairsprings | E-chicago-school | requires-modern-corroboration | chapter-or-section | 0 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 32 Part 1.pdf |
| `source.private.chicago.32b` | Chicago School of Watchmaking · Modern shop methods | E-chicago-school | requires-modern-corroboration | chapter-or-section | 0 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 32 Part 2.PDF |
| `source.private.chicago.33` | Chicago School of Watchmaking · Watch Master timing machine | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 33.PDF |
| `source.private.chicago.34` | Chicago School of Watchmaking · Time-O-Graph | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 34.PDF |
| `source.private.chicago.35` | Chicago School of Watchmaking · Problems and solutions | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 35.PDF |
| `source.private.chicago.4` | Chicago School of Watchmaking · Nomenclature and sizes | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 4.PDF |
| `source.private.chicago.5` | Chicago School of Watchmaking · Mainsprings | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 5.PDF |
| `source.private.chicago.6` | Chicago School of Watchmaking · Motor and jeweled barrels | E-chicago-school | requires-modern-corroboration | chapter-or-section | 3 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 6.PDF |
| `source.private.chicago.7` | Chicago School of Watchmaking · Selecting a mainspring | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 7.PDF |
| `source.private.chicago.8` | Chicago School of Watchmaking · Assembling | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 8.PDF |
| `source.private.chicago.9` | Chicago School of Watchmaking · Winding and setting | E-chicago-school | requires-modern-corroboration | chapter-or-section | 2 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/chicago lesson 9.PDF |
| `source.private.chicago.tools` | Chicago School of Watchmaking · Tools and Materials of the Trade | E-chicago-school | requires-modern-corroboration | chapter-or-section | 1 | sí | reference-library/originals/Chicago CD.iso#Chicago School Watchmaking/Tools & Materials of the Trade.PDF |
| `source.private.chicago.volume` | Chicago School of Watchmaking CD | E-chicago-school | requires-modern-corroboration | document | 0 | sí | reference-library/originals/Chicago CD.iso |
| `source.private.daniels.balance-spring` | George Daniels · Watchmaking · The Balance and Spring | C-daniels-watchmaking | ocr-unverified | page-or-figure | 5 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.casemaking` | George Daniels · Watchmaking · Casemaking | C-daniels-watchmaking | ocr-unverified | page-or-figure | 5 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.engine-turning` | George Daniels · Watchmaking · Engine-Turned Cases and Dials | C-daniels-watchmaking | ocr-unverified | page-or-figure | 3 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.escapements` | George Daniels · Watchmaking · Escapements | C-daniels-watchmaking | ocr-unverified | page-or-figure | 4 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.finishing-metals` | George Daniels · Watchmaking · Finishing Steel and Brass | C-daniels-watchmaking | ocr-unverified | page-or-figure | 7 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.hand-tools` | George Daniels · Watchmaking · Hand Tools | C-daniels-watchmaking | ocr-unverified | page-or-figure | 4 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.jewelling` | George Daniels · Watchmaking · Jewelling | C-daniels-watchmaking | ocr-unverified | page-or-figure | 6 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.mainsprings` | George Daniels · Watchmaking · Mainsprings and Accessories | C-daniels-watchmaking | ocr-unverified | page-or-figure | 5 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.movement-design` | George Daniels · Watchmaking · Movement Design | C-daniels-watchmaking | ocr-unverified | page-or-figure | 10 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.small-components` | George Daniels · Watchmaking · Making Small Components | C-daniels-watchmaking | ocr-unverified | page-or-figure | 5 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.turning` | George Daniels · Watchmaking · Turning | C-daniels-watchmaking | ocr-unverified | page-or-figure | 6 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.watchmaking-volume` | George Daniels - Watchmaking - searchable OCR edition | C-daniels-watchmaking | ocr-unverified | document | 0 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.wheels-pinions` | George Daniels · Watchmaking · Wheels and Pinions | C-daniels-watchmaking | ocr-unverified | page-or-figure | 5 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.daniels.workshop-equipment` | George Daniels · Watchmaking · Workshop and Equipment | C-daniels-watchmaking | ocr-unverified | page-or-figure | 5 | sí | reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf |
| `source.private.horologia-book` | Horologia · libro privado de construcción de relojes mecánicos | C-daniels-watchmaking | ocr-unverified | document | 3 | sí | private-library://horologia-completa |
| `source.private.theory-of-horology.volume` | Theory of Horology - local chapter archive | B-theory-of-horology | verified-secondary | document | 0 | no | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip |
| `source.private.tm9-1575.volume` | TM 9-1575 - Ordnance Maintenance: Wrist Watches, Pocket Watches, Stop Watches, and Clocks | F-tm-9-1575 | requires-modern-corroboration | document | 0 | sí | reference-library/originals/TM 9-1575.pdf |
| `source.private.toh.ch01` | Theory of Horology · The Concept of Time | B-theory-of-horology | verified-secondary | page-or-figure | 2 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 1-3.pdf |
| `source.private.toh.ch02` | Theory of Horology · Instruments for Measuring Time | B-theory-of-horology | verified-secondary | page-or-figure | 1 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 1-3.pdf |
| `source.private.toh.ch03` | Theory of Horology · The Simple Mechanical Movement | B-theory-of-horology | verified-secondary | page-or-figure | 1 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 1-3.pdf |
| `source.private.toh.ch04` | Theory of Horology · The Driving Force in a Mechanical Watch | B-theory-of-horology | verified-secondary | page-or-figure | 4 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 4&5.pdf |
| `source.private.toh.ch05` | Theory of Horology · The Geared Transmission System | B-theory-of-horology | verified-secondary | page-or-figure | 6 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 4&5.pdf |
| `source.private.toh.ch06` | Theory of Horology · Escapements | B-theory-of-horology | verified-secondary | page-or-figure | 3 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 6.pdf |
| `source.private.toh.ch07` | Theory of Horology · Regulating Organs | B-theory-of-horology | verified-secondary | page-or-figure | 5 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 7.pdf |
| `source.private.toh.ch08` | Theory of Horology · Self-winding Watches | B-theory-of-horology | verified-secondary | page-or-figure | 2 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 8.pdf |
| `source.private.toh.ch09` | Theory of Horology · Calendar Mechanisms | B-theory-of-horology | verified-secondary | page-or-figure | 2 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 9.pdf |
| `source.private.toh.ch10` | Theory of Horology · Striking Mechanisms | B-theory-of-horology | verified-secondary | page-or-figure | 1 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 10.pdf |
| `source.private.toh.ch11` | Theory of Horology · Chronograph Mechanisms | B-theory-of-horology | verified-secondary | page-or-figure | 1 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 11.pdf |
| `source.private.toh.ch12` | Theory of Horology · The Exterior of the Watch | B-theory-of-horology | verified-secondary | page-or-figure | 4 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 12.pdf |
| `source.private.toh.ch13` | Theory of Horology · Tribology | B-theory-of-horology | verified-secondary | page-or-figure | 3 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 13.pdf |
| `source.private.toh.ch14` | Theory of Horology · Clockmaking | B-theory-of-horology | verified-secondary | page-or-figure | 0 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#ToH ch 13.5 & 14full.pdf |
| `source.private.toh.ch15` | Theory of Horology · The Electronic Watch | B-theory-of-horology | verified-secondary | page-or-figure | 6 | sí | reference-library/originals/Theory of Horology-20260809T132232Z-1-001.zip#TOH chap. 15.pdf |
| `source.private.vba-uhrentechnik` | VBA Uhrentechnik · corpus de cálculo relojero | other | verified-secondary | document | 22 | sí | reference-library/originals/VBAUhrentechnik.zip |
| `source.private.vba-uhrentechnik-volume` | VBA Uhrentechnik calculation corpus | other | verified-secondary | document | 0 | sí | reference-library/originals/VBAUhrentechnik.zip |
| `source.project.system4b-blueprint` | Horologia sistema 4B blueprint v0.1 | project-original | verified-secondary | document | 0 | no | reference-library/originals/horologia_sistema4b_blueprint_v0.1.zip |
| `source.roediger-karpicke.2006` | Roediger & Karpicke (2006) · Test-enhanced learning | G-watchmaker-or-visual-resource | verified-secondary | document | 1 | sí | https://doi.org/10.1111/j.1467-9280.2006.01693.x |
| `source.seiko.42.technical-guide` | Seiko 42 family Technical Guide | A-manufacturer-official | verified-primary | document | 2 | no | https://seikoserviceusa.com/uploads/datasheets/4205C_06_07_08_25B_27.pdf |
| `source.seiko.6138a.technical-guide` | Seiko 6138A · guía técnica | A-manufacturer-official | verified-primary | document | 5 | no | https://seikoserviceusa.com/uploads/datasheets/6138A.pdf |
| `source.w3c.wcag22` | Web Content Accessibility Guidelines 2.2 | other | verified-secondary | document | 5 | sí | https://www.w3.org/TR/WCAG22/ |

## Fuentes no accesibles

Ninguna de las siete fuentes locales esperadas está ausente.

## Política de uso

- Una fuente nunca adquiere más autoridad que su documento, edición, calibre, página o caso.
- OCR no verifica fórmulas, tablas, medidas ni símbolos.
- Simulación digital no demuestra destreza física.
- Procedimientos históricos peligrosos permanecen no accionables.
- El JSON asociado contiene los campos completos, variantes de cita, alcance, exclusiones, riesgos y dependencias de uso.
