# Compatibilidad del lector continuo — 0.14C

## Modos históricos

| Modo anterior | Modo 0.14C | Razón |
|---|---|---|
| split | learn | Conserva texto y narrativa visual sincronizada. |
| visual | learn | El recurso visual queda subordinado al apartado activo. |
| reading | read | Conserva una lectura continua sin panel visual persistente. |
| focus | read | La lectura limpia se integra en el modo Leer. |
| textual | read | El texto completo sigue siendo la alternativa accesible canónica. |

## Aliases de segmentos

| Método | Aliases |
|---|---:|
| nearest-order | 2004 |
| same-block | 7 |
| same-block-and-heading | 100 |

- Segmentos legados inventariados: **2111**.
- Aliases con destino válido: **2111**.
- Lecciones con cobertura de alias: **222/222**.
- Si un alias no existe, el lector abre el primer apartado sin error fatal.
- `currentSegmentId` y `completedSegmentIds` permanecen almacenados; `completedAt` conserva autoridad explícita.
- Política histórica: `academy.progress-compatibility.pre-0.14B1-study-recognition` v1.0.0, corte `2026-08-14T12:45:00.000Z`.
