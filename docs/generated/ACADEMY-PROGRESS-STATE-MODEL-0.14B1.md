# Modelo de estados de progreso 0.14B.1

## Dimensiones independientes

| Dimensión | Valores | Autoridad |
|---|---|---|
| Reconocimiento de estudio | none, explicit, legacy-inferred | `lessonProgress.completedAt` o compatibilidad histórica acotada |
| Exposición | not-started, in-progress, studied | segmentos y reconocimiento de estudio |
| Práctica | not-started, in-progress, satisfied | sesiones y evaluación existente |
| Mastery | not-assessed, demonstration-due, demonstrated, retention-due, retained | contratos pedagógicos y proyección de mastery |
| Evidencia física | not-required, pending, documented, reviewed | evidencia P explícita y procedencia humana |
| Cobertura | complete, partial, source-review-required, planned | manifiesto curado |

## Reglas

- Estudiar y completar práctica guiada no demuestra una competencia.
- Solo un `mastery-check`, una actividad con intención de demostración o una proyección de mastery pueden producir `demonstrated`.
- `retained` requiere recuperación espaciada o una proyección retained existente.
- Evidencia P revisada no produce retención.
- Un capítulo conceptual puede quedar retained sin P; uno físico puede cerrar su contenido conceptual con P pendiente.
- `coreAvailableComplete` cierra el core disponible. `curriculumComplete` exige además cobertura complete.
- El campo `state` se conserva como proyección legacy y no es fuente de verdad.
