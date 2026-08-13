# ADR-001 — Identidad Aprender / Learn

- Estado: Aceptada
- Fecha: 2026-07-22
- Sistemas afectados: rutas, paquetes, persistencia educativa, telemetría futura, documentación y UI futura.

## Contexto

El área necesita un nombre visible localizable y una identidad interna que no cambie al traducir la aplicación.

## Decisión

La etiqueta española es **Aprender**, la inglesa **Learn** y el identificador técnico inmutable es `learning`. Rutas internas, claves de almacenamiento, namespaces, discriminantes y nombres de paquete usan `learning`; nunca se derivan de una traducción. Esta decisión no añade todavía una ruta ni una pantalla.

## Alternativas consideradas

- `academy`: reconocible comercialmente, pero estrecha el dominio y mezcla marca con contrato.
- `education`: descriptivo, pero menos natural como identidad de producto y más largo en rutas.
- Traducir también el identificador: mejora legibilidad local, pero rompe referencias y migraciones al cambiar de idioma.

## Consecuencias

El código de Sistema 0 vive bajo `src/learning`; los formatos usan prefijos y campos estables en inglés. La UI futura resuelve etiquetas por i18n. Renombrar el área visible no obliga a migrar datos.

## Riesgos

La coexistencia de nombres visibles e internos puede generar mezclas. Se mitiga prohibiendo identificadores persistidos localizados y documentando la convención.

## Documentos relacionados

`APRENDER-DECISIONES.md` D01; `APRENDER-VISION.md`; `APRENDER-SISTEMA-0.md`.
