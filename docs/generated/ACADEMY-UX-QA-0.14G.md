# QA de experiencia · 0.14G

| Caso | Viewport | Tema | Movimiento reducido | Estado | Observación |
|---|---|---|---:|---|---|
| desktop-light | 1440x1000 | light | no | manual-pass | Lector, visual específico, índice y texto alternativo inspeccionados en el navegador de la aplicación. |
| desktop-dark | 1440x1000 | dark | sí | manual-pass | Contraste, diagrama estático y preferencia de movimiento reducido inspeccionados; la preferencia se restauró al terminar. |
| tablet | 1024x768 | system-dark | no | manual-pass | La pregunta central y el documento continuo permanecen disponibles sin navegación nueva. |
| narrow-tablet | 760x900 | system-dark | no | manual-pass | El índice pasa al control compacto y el contenido mantiene el orden de lectura. |
| mobile | 480x900 | system-dark | no | manual-pass | Visual integrado, descripción y navegación inferior inspeccionados sin desbordamiento visible. |
| reflow-200 | 720x900 | system-dark | no | manual-pass | Equivalente geométrico al 200 % inspeccionado con índice compacto y contenido refluido. |
| conflict-recovery-fixture | 1440x1000 | system-dark | no | manual-pass | El aviso se identifica explícitamente como fixture; no representa pérdida ni contiene datos personales. |
| keyboard | 1440x1000 | system-dark | no | automated-pass | Roles, nombres accesibles y activación se cubren por pruebas; el dispatcher Tab del navegador integrado no permitió certificar manualmente la secuencia completa. |
| fallback-no-webgl | all | all | sí | automated-pass | Los seis visuales esenciales son SVG semántico estático y no dependen de WebGL. |
| profile-switch-close-reopen | n/a | n/a | no | automated-pass | Flush, aislamiento por perfil, reapertura y recuperación se validan con adaptadores deterministas; no se declara sesión manual. |

## Rendimiento observado

| Medida | Resultado | Método o límite |
|---|---:|---|
| Flush de 101 mutaciones | 19.052 ms de media (17.065–21.055 ms) | cinco perfiles nuevos; cien mutaciones de Academia y una de accesibilidad encoladas antes de flush |
| Coste medio de cola | 0.1886 ms/mutación | backend memory, 5 rondas |
| Máximo pendiente | 101 | medido inmediatamente después de encolar |
| Payload semántico de visuales | 18754 bytes | 6 diseños, 46 nodos y 38 relaciones |
| Código fuente de fase 0.14G | 93062 bytes | 12 archivos bajo `phase014g/` |
| Build Vite | 1.18 s | comando completo: 45924.8 ms, incluye schema y TypeScript |

Chunks observados en el build de producción:

| Chunk | Bytes | Gzip |
|---|---:|---:|
| `AcademyContinuousLessonSurface-DpWNEjql.js` | 22503 | 6689 |
| `AcademyContinuousLessonSurface-C3tfdrLQ.css` | 12573 | 2804 |
| `AcademyReaderVisual-aJdr7OVW.js` | 184467 | 56045 |
| `academyPersonalCurriculum-fc4yvSkS.js` | 213432 | 59928 |

Tiempo hasta texto y tiempo hasta visual quedan **no medidos**: El navegador integrado permitió verificar presencia y render, pero no expuso Performance API; no se inventa una duración.

## Distinciones

- La prueba automatizada cubre persistencia, contratos de documentos, aliases, evidencia y render estático.
- La inspección visual usa el navegador de la aplicación y se registra solo tras observar la pantalla real.
- El adaptador SQLite se prueba con gateway contractual; no se declara una sesión nativa externa.
- El aviso de conflicto mostrado en la fixture de QA está etiquetado como simulación y no falsifica una pérdida real.
