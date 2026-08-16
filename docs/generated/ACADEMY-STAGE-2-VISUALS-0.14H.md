# Visuales de etapa 2 · 0.14H

- Preguntas visuales esenciales: 15.
- Diseños versionados: 22; reutilizados: 11; nuevos: 11.
- El único 3D reutilizado es la vista conceptual del tren de 0.14E; no se crea un calibre ficticio.
- Cada diseño apunta a un apartado explicativo específico; ya no existe el apartado universal «Qué mirar en el diagrama». IDs, `contentHash` y `visualHash` permanecen estables respecto a la implementación H anterior.

| Pregunta | Diseño | Lecciones | Estado | Fuente verificada | Límite |
|---|---|---:|---|---|---|
| q01-energy-flow | `visual.mechanical-energy.flow` | 1 | reused-and-versioned | source.private.toh.ch04 · PDF 2 / impresa 46 · Fig. 4-4 | Flujo conceptual, sin pérdidas cuantitativas. |
| q02-energy-quantities | `visual.stage2.energy-quantities.v1` | 2 | implemented | source.private.toh.ch04 · PDF 2 / impresa 46 | No se muestran valores ni una fórmula aplicable. |
| q03-barrel-anatomy | `visual.barrel.anatomy` | 1 | reused-and-versioned | source.private.toh.ch04 · PDF 2 / impresa 46 · Fig. 4-4 | Despiece esquemático; no guía una apertura. |
| q04-barrel-states | `visual.barrel.winding-discharge` | 1 | reused-and-versioned | source.private.toh.ch04 · PDF 2 / impresa 46 | Estados relativos; no representa fuerzas reales. |
| q04-barrel-states | `visual.stage2.barrel-states.v1` | 1 | implemented | source.private.toh.ch04 · PDF 2 / impresa 46 | No es una curva de par ni una reserva de calibre. |
| q05-gear-pair | `visual.gear-pair.ratio` | 2 | reused-and-versioned | source.private.toh.ch05 · PDF 9 / impresa 53 · Fig. 5-10 | Modelo ideal sin pérdidas ni depthing. |
| q05-gear-pair | `visual.gear-pair.direction-torque` | 1 | reused-and-versioned | source.private.toh.ch05 · PDF 9 / impresa 53 · Fig. 5-10 | No predice eficiencia o resistencia. |
| q06-compound-train | `visual.train.real-order` | 1 | reused-and-versioned | source.private.toh.ch05 · PDF 12 / impresa 56 · Fig. 5-15 | No reproduce la planta de un calibre. |
| q06-compound-train | `visual.train.3d-overview` | 1 | reused-and-versioned | source.private.toh.ch05 · PDF 12 / impresa 56 | Se reutiliza el estado 3D conceptual de 0.14E; no es un fixture de calibre. |
| q06-compound-train | `visual.stage2.compound-train.v1` | 2 | implemented | source.private.toh.ch05 · PDF 12 / impresa 56 · Fig. 5-15 | Solo representa las etapas declaradas. |
| q07-going-vs-motion | `visual.stage2.going-vs-motion.v1` | 2 | implemented | source.private.toh.ch05 · PDF 18 / impresa 62 · Fig. 5-26 | Arquitectura funcional, no disposición universal. |
| q08-escapement-anatomy | `visual.escapement.interfaces` | 2 | reused-and-versioned | source.private.toh.ch06 · PDF 3 / impresa 101 · Figs. 6-6 y 6-7 | No es geometría de ajuste. |
| q09-escapement-cycle | `visual.escapement.phases` | 2 | reused-and-versioned | source.private.toh.ch06 · PDF 8 / impresa 106 · Tabla 6.3.1 | No importa ángulos ni velocidad real. |
| q10-escapement-safety | `visual.stage2.escapement-safety.v1` | 1 | implemented | source.private.toh.ch06 · PDF 3 / impresa 101 · Fig. 6-6 | No prescribe holguras o correcciones. |
| q11-frequency-amplitude | `visual.oscillator.active-length` | 2 | reused-and-versioned | source.private.toh.ch07 · PDF 5 / impresa 133 · Figs. 7-8 a 7-10 | No muestra deformación ni ajuste real. |
| q11-frequency-amplitude | `visual.stage2.frequency-amplitude.v1` | 2 | implemented | source.private.toh.ch07 · PDF 5 / impresa 133 · Fig. 7-10 | Curva cualitativa, sin marcha medida. |
| q12-feedback-loop | `visual.oscillator.feedback` | 1 | reused-and-versioned | source.private.toh.ch06 · PDF 8 / impresa 106 | No es simulación dinámica. |
| q12-feedback-loop | `visual.stage2.feedback-loop.v1` | 1 | implemented | source.private.toh.ch06 · PDF 8 / impresa 106 | Sin fuerzas ni geometría cuantitativa. |
| q13-keyless-states | `visual.stage2.keyless-states.v1` | 2 | implemented | source.private.toh.ch05 · PDF 18 / impresa 62 · Fig. 5-26 | Estados conceptuales; no operación física. |
| q14-automatic-flow | `visual.stage2.automatic-flow.v1` | 2 | implemented | source.private.toh.ch08 · PDF 3 / impresa 171 · Figs. 8-6 y 8-7 | No universaliza inversión, eficiencia o sentido. |
| q15-calendar-sequence | `visual.stage2.calendar-sequence.v1` | 3 | implemented | source.private.toh.ch09 · PDF 3 / impresa 191 · Fig. 9-5 | No define zona segura ni procedimiento de corrección. |
| q15-calendar-sequence | `visual.stage2.control-states.v1` | 1 | implemented | source.private.toh.ch09 · PDF 3 / impresa 191 | La analogía no identifica una arquitectura de cronógrafo. |

Todos los gráficos son SVG semántico generado desde datos, tienen descripción larga, etiquetas independientes del color, reflujo móvil y estado estático seguro con movimiento reducido.
