# ADR-003 — Fidelidad separada G/K/P

- Estado: Aceptada
- Fecha: 2026-07-22
- Sistemas afectados: simulación, validación, evidencias, escenas, metrología futura y tutor futuro.

## Contexto

Una representación visual precisa puede tener cinemática aproximada o carecer de física. Una bandera de exactitud no permite comunicar esa diferencia ni separar aprendizaje de validación técnica.

## Decisión

Cada resultado o afirmación relevante declara un perfil con geometría `G0…G4`, cinemática `K0…K4` y física `P0…P4`. Los niveles son ordinales dentro de su eje, no intercambiables ni una puntuación global.

`EvidenceClaim`, `EducationalSimulationResult`, `EngineeringValidationResult` y `ProjectChangeProposal` tienen discriminantes y cargas distintas. Observación, fuente, cálculo, inferencia e hipótesis también son clases explícitas. Ningún resultado educativo autoriza una modificación técnica: solo una propuesta separada y una aceptación futura pueden hacerlo.

## Alternativas consideradas

- `isExact`: sencillo, pero falso para sistemas con fidelidades mixtas.
- Un nivel único: comparable, pero oculta qué dimensión falta.
- Reutilizar el resultado del motor técnico con una etiqueta educativa: reduce tipos, pero permite confundir autoridad y propósito.

## Consecuencias

Las afirmaciones conservan método, procedencia, limitaciones, fiabilidad, incertidumbre, huella de entradas, versión/fecha y fuentes. Los consumidores deben mostrar límites y comprobar capacidades; G4/K4/P4 no se presuponen.

## Riesgos

Los autores podrían inflar niveles. Se mitiga con procedencia, evidencia y validadores; una política de certificación queda fuera de Sistema 0.

## Documentos relacionados

`APRENDER-DECISIONES.md` D04; `APRENDER-ARQUITECTURA.md`; `APRENDER-MODELO-DATOS.md`.
