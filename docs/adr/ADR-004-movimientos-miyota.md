# ADR-004 — Movimientos de referencia MIYOTA

- Estado: Aceptada
- Fecha: 2026-07-22
- Sistemas afectados: referencias de movimiento, contenido, procedencia, fixtures y biblioteca futura.

## Contexto

Aprender necesita referencias concretas sin convertir datos parciales o inferidos en geometría oficial. El producto debe seguir siendo multimarca.

## Decisión

MIYOTA 2035 será la referencia inicial de cuarzo y MIYOTA 8215 la referencia mecánica profunda. Las familias 82 y 90 son ampliaciones posteriores. El canon no contiene lógica específica de MIYOTA.

Los hechos atribuidos a MIYOTA deben proceder de su catálogo o documentos oficiales y conservar URL, calibre y fecha de consulta. Mediciones de una unidad, teoría privada y contenido derivado usan autoridades distintas. Un dato interno no documentado permanece `unknown` o `placeholder`; no se infiere de dibujos ni de calibres cercanos.

## Alternativas consideradas

- Movimiento abstracto únicamente: evita riesgos de fuente, pero no prueba trazabilidad real.
- Modelar toda una familia desde el inicio: ofrece cobertura, pero amplía el riesgo de datos inventados y el alcance.
- Acoplar el canon a 8215: acelera un curso, pero impide multimarca y scratch.

## Consecuencias

Sistema 0 incluye solo un fixture documental/semántico 8215 y reutiliza el catálogo oficial curado. No importa PDFs, no crea una descomposición física interna ni afirma compatibilidad de donantes.

## Riesgos

Las páginas oficiales pueden cambiar. Se conserva fecha y localizador, y los futuros cachés deberán usar hash sin alterar la autoridad original.

## Documentos relacionados

`APRENDER-DECISIONES.md` D02 y D11; `FUENTES-MIYOTA.md`; `APRENDER-CONTENIDO.md`.
