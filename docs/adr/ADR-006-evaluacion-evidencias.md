# ADR-006 — Evaluación determinista basada en evidencias

- Estado: Aceptada
- Fecha: 2026-07-22
- Sistemas afectados: actividades, rúbricas, progreso, sesiones, revisión humana y tutor futuro.

## Contexto

Finalizar una actividad no demuestra por sí solo una competencia. El progreso debe poder explicarse y reproducirse offline sin depender de IA.

## Decisión

La evaluación conserva evidencia inmutable y aplica una versión concreta de reglas deterministas. Los estados son `not_started`, `introduced`, `practising`, `demonstrated` y `retained`. Una regla declara umbral, cantidad mínima, tipos de evidencia y, para retención, separación temporal mínima.

`LearningSession` fija paquete, actividad, rúbrica, proyecto o plantilla, fingerprint inicial, capacidades y overlay reversible. `AssessmentResult` conserva IDs de evidencias usadas, regla, estado anterior/nuevo y explicación. Los eventos de finalización no se convierten automáticamente en evidencia suficiente.

## Alternativas consideradas

- Compleción igual a dominio: simple, pero pedagógicamente inválido.
- Puntuación opaca calculada por IA: adaptable, pero no reproducible ni offline.
- Estado editable sin evidencias: flexible, pero sin auditoría.

## Consecuencias

Sistema 0 incluye un evaluador puro, estable ante el orden de entrada y con reglas versionadas. La IA futura podrá sugerir o explicar, no alterar silenciosamente el resultado. La revisión humana futura añadirá evidencia o una regla explícita.

## Riesgos

Las reglas iniciales son deliberadamente simples. Evolucionarlas exige nuevas versiones, nunca reinterpretar resultados históricos con una regla distinta sin indicarlo.

## Documentos relacionados

`APRENDER-DECISIONES.md` D08 y D10; `APRENDER-MODELO-DATOS.md`; `APRENDER-CONTENIDO.md`.
