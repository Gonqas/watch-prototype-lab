# QA de experiencia · 0.14H

| Caso | Captura | Viewport | Tema | Movimiento reducido | Estado | Observación |
|---|---|---|---|---:|---|---|
| path-desktop-light | `01-path-desktop-light.png` | 1440x1000 | light | no | passed | Ruta completa; etapa 2 y seis capítulos visibles, sin desbordamiento. |
| path-desktop-dark | `02-path-desktop-dark.png` | 1440x1000 | dark | no | passed | Contraste de la ruta comprobado en tema oscuro. |
| path-tablet | `03-path-tablet.png` | 1024x768 | light | no | passed | Etapa 2 y capítulos reordenan sin solapamiento. |
| path-narrow | `04-path-narrow.png` | 760x900 | light | no | passed | Tarjetas sin solapamiento ni desplazamiento horizontal. |
| path-mobile | `05-path-mobile.png` | 480x900 | light | no | passed | Reflujo móvil y navegación inferior comprobados. |
| reader-energy-desktop | `06-reader-energy-desktop.png` | 1440x1000 | light | no | passed | Pregunta central, índice y narrativa continua sincronizados. |
| reader-barrel-dark | `07-reader-barrel-dark.png` | 1440x1000 | dark | no | passed | Barrilete legible y contrastado en tema oscuro. |
| reader-gears-tablet | `08-reader-gears-tablet.png` | 1024x768 | light | no | passed | Pareja de engrane conserva jerarquía en tableta. |
| reader-train-mobile | `09-reader-train-mobile.png` | 480x900 | light | no | passed | Tren, controles e índice refluye sin desbordamiento. |
| reader-escapement-desktop | `10-reader-escapement-desktop.png` | 1440x1000 | light | no | passed | Ciclo del escape mantiene pregunta y resultado observables. |
| reader-oscillator-dark | `11-reader-oscillator-dark.png` | 1024x768 | dark | no | passed | Frecuencia y amplitud permanecen diferenciadas y legibles. |
| reader-keyless-narrow | `12-reader-keyless-narrow.png` | 760x900 | light | no | passed | Estados de corona refluye en ancho estrecho. |
| reader-automatic-mobile | `13-reader-automatic-mobile.png` | 480x900 | light | no | passed | Carga automática legible como ampliación funcional. |
| reader-calendar-desktop | `14-reader-calendar-desktop.png` | 1440x1000 | light | no | passed | Secuencia de fecha legible sin instrucción universal de corrección. |
| reader-reduced-motion | `15-reader-reduced-motion.png` | 1024x768 | light | sí | passed | Visual estático comprobado; cero elementos con animación activa. |
| reader-fallback-text | `16-reader-fallback-text.png` | 760x900 | light | sí | passed | Descripción textual, pregunta visual y límites siguen disponibles. |
| activity-overlay | `17-activity-overlay.png` | 1440x1000 | light | no | passed | Overlay presenta la actividad histórica sin cambiar su activityId. |
| personal-practice | `18-personal-practice.png` | 1024x768 | light | no | passed | Práctica opcional declara que no completa ni acredita destreza. |
| stage2-checkpoint | `19-stage2-checkpoint.png` | 1440x1000 | light | no | passed | Once preguntas y siete acciones comprobadas antes de etapa 3. |
| keyboard-focus-reflow | `20-keyboard-focus-reflow.png` | 480x900@200% | dark | sí | passed | Foco visible, teclado y reflujo real al 200 %, sin desbordamiento. |

Los estados se actualizan únicamente después de inspeccionar el navegador real. Accesibilidad cubierta: teclado, foco, reflujo al 200 %, tema oscuro, movimiento reducido, descripción textual y fallback sin visual.
