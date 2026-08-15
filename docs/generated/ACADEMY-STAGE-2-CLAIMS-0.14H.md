# Claims y fórmulas de etapa 2 · 0.14H

| Claim | Lección | Verificación | Localizador | Aplicabilidad | Límite |
|---|---|---|---|---|---|
| `claim.014h.energy.storage-delivery` | `lesson.mechanical.energy` | visually-verified | source.private.toh.ch04 · PDF 2 / impresa 46 · Fig. 4-4 | Arquitectura mecánica general. | No cuantifica reserva, potencia o pérdidas. |
| `claim.014h.barrel.parts` | `lesson.mechanical.barrel` | visually-verified | source.private.toh.ch04 · PDF 2 / impresa 46 · Fig. 4-4 | Barrilete convencional descrito por la fuente. | No prescribe apertura o lubricación. |
| `claim.014h.gears.pitch-circles` | `lesson.mechanical.gear-pair` | visually-verified | source.private.toh.ch05 · PDF 9 / impresa 53 · Fig. 5-10 | Modelo geométrico ideal. | No verifica depthing o perfil real. |
| `claim.014h.train.intermediate` | `lesson.mechanical.train` | visually-verified | source.private.toh.ch05 · PDF 12 / impresa 56 · Figs. 5-14 y 5-15 | Trenes de ruedas convencionales. | No representa la planta de un calibre. |
| `claim.014h.train.motion-branch` | `lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren` | visually-verified | source.private.toh.ch05 · PDF 18 / impresa 62 · Fig. 5-26 | Arquitectura funcional general. | La disposición concreta varía. |
| `claim.014h.escapement.components` | `lesson.mechanical.escapement` | visually-verified | source.private.toh.ch06 · PDF 3 / impresa 101 · Figs. 6-6 y 6-7 | Escape de áncora suizo. | No se generaliza a otros escapes. |
| `claim.014h.escapement.sequence` | `lesson.encyclopedia.escapements-chronometry.toh-escape-fases` | visually-verified | source.private.toh.ch06 · PDF 8 / impresa 106 · Tabla 6.3.1 | Escape de áncora suizo. | Los ángulos de la tabla no se importan. |
| `claim.014h.oscillator.parts` | `lesson.mechanical.oscillator` | visually-verified | source.private.toh.ch07 · PDF 5 / impresa 133 · Figs. 7-8 a 7-10 | Órgano regulador mecánico descrito. | No predice marcha real. |
| `claim.014h.oscillator.feedback` | `lesson.mechanical.escape-oscillator` | visually-verified | source.private.toh.ch06 · PDF 8 / impresa 106 | Modelo funcional del escape de áncora. | No simula fuerzas. |
| `claim.014h.motion-works.indication` | `lesson.mechanical.motion-works` | visually-verified | source.private.toh.ch05 · PDF 18 / impresa 62 · Fig. 5-26 | Tren de puesta en hora representado por la fuente. | No prescribe ajuste de agujas. |
| `claim.014h.keyless.selection` | `lesson.mechanical.keyless` | visually-verified | source.private.toh.ch05 · PDF 18 / impresa 62 · Fig. 5-26 | Principio general de puesta en hora. | Las posiciones y piezas dependen del calibre. |
| `claim.014h.automatic.rotor` | `lesson.encyclopedia.complications.automatico-y-reserva` | visually-verified | source.private.toh.ch08 · PDF 3 / impresa 171 · Figs. 8-6 y 8-7 | Sistema automático general. | No afirma sentido, eficiencia o reserva. |
| `claim.014h.calendar.date-train` | `lesson.encyclopedia.complications.calendarios` | visually-verified | source.private.toh.ch09 · PDF 3 / impresa 191 · Fig. 9-5 | Calendario de fecha simple descrito. | No define ventana segura de corrección. |
| `claim.014h.stage2.functional-chain` | `lesson.mechanical.automatic-calendar` | visually-verified | source.private.toh.ch08 · PDF 3 / impresa 171 | Clasificación curricular conceptual. | La relación es editorial y no afirma una arquitectura única. |
| `claim.014h.calendar.discrete-state` | `lesson.advanced.calendars` | visually-verified | source.private.toh.ch09 · PDF 3 / impresa 191 | Comparación conceptual. | Los mecanismos concretos siguen source-limited. |

## Fórmulas

| Fórmula | Decisión | Fuente | Razón |
|---|---|---|---|
| `formula.014e.gear-pair-ratio` | reused-verified | source.horology.private-book.wheels-pinions | Revisión 0.14E conservada: No expresa pérdidas, perfil, depthing ni resistencia. |
| `formula.014e.train-product` | reused-verified | source.horology.private-book.wheels-pinions | Revisión 0.14E conservada: Solo se aplica a las etapas y signos definidos en el ejercicio. |
| `formula.014e.oscillator-period` | reused-verified | source.horology.private-book.balance-spring | Revisión 0.14E conservada: Relación definitoria; no calcula marcha real. |
| `formula.014e.oscillator-alternations` | reused-verified | source.horology.private-book.balance-spring | Revisión 0.14E conservada: f se expresa en ciclos por segundo; no sustituye la especificación del calibre. |
| `formula.014h.daniels-mainspring` | not-used | source.private.daniels.mainsprings | La fuente OCR no se verificó visualmente para una fórmula concreta. |
| `formula.014h.daniels-gear-geometry` | not-used | source.private.daniels.wheels-pinions | No se transfiere geometría de fabricación desde OCR. |
| `formula.014h.daniels-escapement` | not-used | source.private.daniels.escapements | Ángulos y tablas de escape requieren verificación visual y aplicabilidad. |
| `formula.014h.daniels-balance` | not-used | source.private.daniels.balance-spring | No se presenta una fórmula OCR como relación verificada. |

Las cuatro revisiones no OCR de 0.14E se conservan. Cuatro candidatos de Daniels quedan `not-used`: no se ha verificado visualmente una fórmula concreta y aplicable. No se cierran artificialmente los 17 gaps OCR históricos.
