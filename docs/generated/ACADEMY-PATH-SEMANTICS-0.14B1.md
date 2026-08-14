# Semántica de la ruta 0.14B.1

La ruta conserva 8 etapas, 32 capítulos, 83 anchors y 83 prácticas requeridas. No cambia ningún ID de contenido o progreso.

## Antes y después

| Antes (0.14B) | Después (0.14B.1) |
|---|---|
| `coreComplete` implicaba `demonstrated`. | `coreAvailableComplete` solo cierra teoría y prácticas disponibles; mastery procede de evaluaciones reales. |
| Evidencia P revisada implicaba `consolidated`. | La evidencia P solo actualiza `physicalEvidenceStatus`; retención procede de mastery o recuperación espaciada. |
| `anchorLessonIds` y `requiredActivityIds` se emparejaban por índice en UI. | 83 `AcademyLearnerStep` declaran la relación; los arrays legacy son derivados. |
| Inicio y Contexto usaban motores distintos. | Ambos consumen `academyNextAction(snapshot, localState)` y exponen el mismo `actionId`. |
| Una cobertura parcial podía aparecer como completada. | Se muestra “Contenido disponible completado · cobertura curricular parcial”. |
| La primera actividad del paquete podía ser la continuación. | La transición busca la primera práctica requerida pendiente del step curado. |

## Pasos explícitos

- Cero prácticas requeridas: 0 pasos actuales (admitidos por contrato y cubiertos con fixture).
- Una práctica requerida: 83.
- Varias prácticas requeridas: 0 pasos actuales (admitidos por contrato y cubiertos con fixture).
- IDs únicos: 83/83.
- Prácticas obligatorias huérfanas: 0.

## Continuidad y métricas

1. `lesson-complete-to-required-activity`: abre la primera práctica requerida pendiente y desbloqueada.
2. `lesson-complete-to-next-action`: consulta el motor único cuando el step no tiene práctica pendiente.
3. `lesson-complete-outside-main-path`: usa el contrato de estudio o vuelve a la ruta de Biblioteca.

Las actividades opcionales no desplazan a las requeridas. `material.activities[0]` no participa en la decisión.
