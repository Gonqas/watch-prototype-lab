# Lector continuo de la Academia — 0.14C

Fase detenida en **0.14C**. Este informe describe la capa de presentación y compatibilidad; no modifica el contenido fuente.

## Resultado

| Métrica | Valor |
|---|---:|
| Lecciones convertidas | 222 |
| Apartados semánticos | 2568 |
| Lecciones piloto curadas | 21 |
| Aliases legados | 2111 |
| Cues visuales | 2568 |
| Escenas 3D existentes | 97 |
| Diagramas originales | 401 |
| Ausencias justificadas | 1932 |
| Gaps visuales registrados | 138 |
| Incidencias de conversión | 0 |

## Contrato

- Los límites de apartado proceden de bloques y encabezados autorados; no existe un límite de 210 palabras.
- No se generan títulos de continuación.
- Aprender y Leer comparten el mismo documento y los mismos IDs.
- Scroll, tiempo y secciones visitadas nunca completan una lección.
- Solo la acción final explícita registra `completedAt` y consulta el `AcademyLearnerStep` curado.
- El Markdown se procesa como AST con GFM, sin HTML crudo ni esquemas de URL peligrosos.
- Las métricas son exclusivamente locales: `reader.open`, `reader.mode.learn`, `reader.mode.read`, `reader.outline.open`, `reader.outline.jump`, `reader.resume`, `reader.return`, `reader.alias.fallback`, `reader.section.enter`, `reader.cue.change`, `reader.source.open`, `reader.glossary.open`, `reader.active-minute`, `reader.click`, `reader.exit-incomplete`, `reader.explicit-completion`, `reader.practice.transition`.

## Límites preservados

No se han corregido fórmulas OCR, claims amplios, vacíos técnicos de etapa 5 ni contenido visible de las 222 lecciones.
