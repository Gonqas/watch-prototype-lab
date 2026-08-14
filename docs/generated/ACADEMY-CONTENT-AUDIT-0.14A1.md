# Auditoría semántica integral de la Academia — 0.14A.1

Huella del corpus: `1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e`  
Baseline preservado: **0.14A (1881 instancias sin calibrar)**  
Paquetes/rutas/módulos/lecciones/actividades visibles: **8/24/217/222/289**

## Resultado calibrado

| Grupo | Conteo |
|---|---:|
| Incidencias registradas 0.14A.1 | 684 |
| Migraciones globales (raíces) | 3 |
| Incidencias confirmadas | 53 |
| Incidencias probables | 124 |
| Heurísticas de baja confianza | 343 |
| Incidencias derivadas | 35 |
| Problemas de claim/fuente | 164 |
| Seguridad operativa accionable | 0 |
| Riesgo histórico no operativo | 213 lecciones |
| Prerrequisitos impropios | 9 incidencias / 3 lecciones |
| Falsos positivos eliminados por detectores recalibrados | 353 |
| Falsos negativos descubiertos y confirmados | 9 enlaces en 3 lecciones |

Las 654 apariciones estructurales de idioma, módulo unitario y nombre redundante se explican mediante **3 causas globales** y no incrementan prioridades individuales.

## Fuentes e inventarios

Registros de fuente: **189**; originales accesibles: **7/7**.

| Snapshot | Método | SHA-256 verificado | Estado | Versión |
|---|---|---|---|---|
| `source.private.chicago.volume` | hybrid | `a969f30e81e355ad7e000b012a9a7e612d43e86c64eac179788188327cdccdfa` | válido | 0.14A1.1 |
| `source.private.daniels.watchmaking-volume` | hybrid | `78cb0b2931e256f42e6f2843c21be86e47762c0e53f755eef04c86c798e348b2` | válido | 0.14A1.1 |

Los inventarios Chicago y Daniels son snapshots curados/híbridos. Esta ejecución compara hash; no afirma volver a extraer por completo el ISO o PDF. Un hash diferente invalida la verificación.

## Prerrequisitos semánticos reales

- `lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple`: `concept.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora.canon-de-minutos` — later-detail-before-overview: Una visión general del movimiento no debe exigir detalles posteriores de minutería y puesta en hora que debe situar primero.; `concept.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora.rueda-de-minuteria` — later-detail-before-overview: Una visión general del movimiento no debe exigir detalles posteriores de minutería y puesta en hora que debe situar primero.; `concept.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora.puesta-en-hora` — later-detail-before-overview: Una visión general del movimiento no debe exigir detalles posteriores de minutería y puesta en hora que debe situar primero.
- `lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante`: `concept.encyclopedia.escapements-chronometry.toh-tourbillon-carrusel.jaula` — advanced-complication-before-basic-skill: Centrado y alabeo básicos no requieren tourbillon, carrusel ni promedio posicional.; `concept.encyclopedia.escapements-chronometry.toh-tourbillon-carrusel.periodo-de-rotacion` — advanced-complication-before-basic-skill: Centrado y alabeo básicos no requieren tourbillon, carrusel ni promedio posicional.; `concept.encyclopedia.escapements-chronometry.toh-tourbillon-carrusel.promedio-posicional` — advanced-complication-before-basic-skill: Centrado y alabeo básicos no requieren tourbillon, carrusel ni promedio posicional.
- `lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b`: `concept.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio.arquitectura-de-producto` — modern-design-framework-before-historical-case: El caso histórico no aplica deliberadamente esos marcos modernos de diseño como requisito de entrada.; `concept.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio.presupuesto-de-error` — modern-design-framework-before-historical-case: El caso histórico no aplica deliberadamente esos marcos modernos de diseño como requisito de entrada.; `concept.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio.v-model-de-validacion` — modern-design-framework-before-historical-case: El caso histórico no aplica deliberadamente esos marcos modernos de diseño como requisito de entrada.

## Seguridad y vigencia

- Riesgo de obra, riesgo de claim, riesgo de procedimiento y riesgo operativo de lección se contabilizan por separado.
- Una referencia histórica con químicos, radio, ácido, llama o maquinaria no bloquea una lección conceptual por herencia.
- Solo se bloquea una combinación verificable de operación accionable, verbo, peligro, secuencia y contexto de ejecución.
- Lecciones con procedimiento operativo bloqueado: **0**.

## Gold set

Fixtures: **47 lecciones + 33 actividades**; aserciones: **624/624 correctas**; fallos: **0**.

## Top 30 de prioridad editorial

| Pos. | Score | Nivel | Confianza | Lección | Raíces | Acción |
|---:|---:|---|---|---|---:|---|
| 1 | 84 | high | high | `lesson.encyclopedia.escapements-chronometry.bulova-centrado-volante` | 5 | manual-review |
| 2 | 77 | high | high | `lesson.mechanical.energy` | 8 | manual-review |
| 3 | 75 | high | high | `lesson.mechanical.train` | 7 | manual-review |
| 4 | 75 | high | high | `lesson.mechanical.oscillator` | 7 | manual-review |
| 5 | 75 | high | high | `lesson.mechanical.keyless` | 7 | manual-review |
| 6 | 75 | high | high | `lesson.mechanical.automatic-calendar` | 7 | manual-review |
| 7 | 74 | high | high | `lesson.encyclopedia.micromechanics.ruedas-y-pinones` | 3 | manual-review |
| 8 | 71 | high | high | `lesson.encyclopedia.service-tribology.toh-lubricacion-retencion` | 3 | manual-review |
| 9 | 71 | high | high | `lesson.encyclopedia.service-tribology.bulova-montaje-barrilete` | 3 | manual-review |
| 10 | 70 | high | high | `lesson.mechanical.escapement` | 6 | manual-review |
| 11 | 70 | high | high | `lesson.metrology.physical-measurement` | 4 | manual-review |
| 12 | 68 | high | high | `lesson.quartz2035.workstation` | 6 | manual-review |
| 13 | 68 | high | high | `lesson.quartz2035.tools` | 6 | manual-review |
| 14 | 68 | high | high | `lesson.quartz2035.observe` | 6 | manual-review |
| 15 | 68 | high | high | `lesson.encyclopedia.micromechanics.ejes-pivotes-y-reparacion` | 3 | manual-review |
| 16 | 67 | high | high | `lesson.mechanical.barrel` | 6 | manual-review |
| 17 | 67 | high | high | `lesson.mechanical.gear-pair` | 6 | manual-review |
| 18 | 67 | high | high | `lesson.mechanical.supports` | 6 | manual-review |
| 19 | 67 | high | high | `lesson.mechanical.escape-oscillator` | 6 | manual-review |
| 20 | 67 | high | high | `lesson.mechanical.motion-works` | 6 | manual-review |
| 21 | 67 | high | high | `lesson.mechanical.final-project` | 6 | manual-review |
| 22 | 67 | high | high | `lesson.encyclopedia.dials-hands-finishing.decoracion-del-movimiento` | 3 | manual-review |
| 23 | 65 | high | high | `lesson.encyclopedia.escapements-chronometry.toh-escape-fases` | 4 | manual-review |
| 24 | 61 | high | high | `lesson.encyclopedia.history-language.industrializacion-y-familias` | 3 | manual-review |
| 25 | 61 | high | high | `lesson.encyclopedia.mechanical-energy-trains.toh-engranaje-geometria` | 3 | manual-review |
| 26 | 61 | high | high | `lesson.encyclopedia.mechanical-energy-trains.toh-relaciones-tren` | 3 | manual-review |
| 27 | 61 | high | high | `lesson.encyclopedia.mechanical-energy-trains.toh-minuteria-friccion` | 3 | manual-review |
| 28 | 61 | high | high | `lesson.encyclopedia.cases-water.chicago-caja-corona-tija` | 3 | manual-review |
| 29 | 61 | high | high | `lesson.encyclopedia.atlas-restoration-design.identidad-y-comparacion` | 3 | manual-review |
| 30 | 60 | high | high | `lesson.encyclopedia.escapements-chronometry.toh-seguridad-escape` | 3 | manual-review |

## Decisiones que requieren revisión humana

- Resolver los prerrequisitos impropios mediante edición curada; esta auditoría solo propone.
- Confirmar locadores de claims numéricos y fórmulas en la página/figura/tabla aplicable.
- Decidir si los pasaportes psicomotores obtendrán una vía física P separada de las actividades virtuales actuales.
- Revisar clasificaciones de confianza baja y las alternativas registradas antes de mover contenido.
- Revisar los vacíos de integración de etapa 5 sin convertir fabricación aislada en construcción de reloj.

## Limitaciones

- La clasificación evita usar el cuerpo completo como señal dominante, pero el texto visible sigue siendo necesario para auditar claims y procedimientos concretos.
- Los campos de autoría no declaran hoy una fuente primaria explícita; la fuente derivada se marca como regla semántica, nunca por posición incidental.
- El gold set fija casos curados, no una distribución numérica objetivo.
- No se modificó contenido visible, navegación, segmentación, IDs, progreso, sesiones ni bases locales.
