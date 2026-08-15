# Prerrequisitos efectivos de etapa 1 · 0.14G

| Lección | Rol | Bloqueante | Requisitos efectivos | Razón |
|---|---|---:|---|---|
| `lesson.horology.system` | anchor | no | ninguno | La visión del reloj completo es la entrada conceptual de etapa 1; etapa 0 se recomienda como preparación personal. |
| `lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple` | support | no | `concept.horology.functional-chain` | La visión general introduce el sistema y no debe exigir detalles posteriores de minutería o puesta en hora. |
| `lesson.horology.mechanical-chain` | anchor | sí | `concept.horology.functional-chain`<br>`concept.horology.part-language` | El mapa funcional y el lenguaje básico se introducen en la primera ancla de la etapa. |
| `lesson.horology.quartz-chain` | support | no | `concept.horology.functional-chain` | La rama de cuarzo es especialización de apoyo y no debe bloquear ni ser bloqueada por la ruta mecánica. |
| `lesson.horology.functional-equivalence` | anchor | sí | `concept.horology.mechanical-chain` | La comparación necesita el mapa mecánico; el mapa de cuarzo permanece recomendado y accesible como apoyo, no como bloqueo. |
| `lesson.encyclopedia.history-language.leer-documentacion` | anchor | sí | `concept.horology.functional-chain` | Leer documentación es una competencia de procedencia; los detalles avanzados de transición electromecánica son semánticamente impropios. |
| `lesson.encyclopedia.history-language.medir-el-tiempo` | optional-branch | no | ninguno | El contenido histórico y conceptual enriquece la etapa sin bloquear el recorrido principal. |
| `lesson.advanced.atlas-authority` | reference | no | ninguno | La guía de autoridad se ofrece como consulta transversal; su prerequisito externo avanzado no se aplica a este uso de referencia. |

No se modifica el contenido bruto. Se neutralizan como bloqueos los detalles posteriores de minutería/puesta en hora, los detalles avanzados de transición electromecánica y el uso temprano de una ruta avanzada como requisito de la guía de autoridad.
