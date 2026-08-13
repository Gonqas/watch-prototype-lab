# ADR-005 — Contenido declarativo versionado

- Estado: Aceptada
- Fecha: 2026-07-22
- Sistemas afectados: paquetes educativos, escenas, importación, activos, autoría futura y funcionamiento offline.

## Contexto

Lecciones y escenas deben evolucionar sin incrustarse en React ni ejecutar código de terceros. Los paquetes privados locales no pueden depender de una infraestructura de firma.

## Decisión

`.wplab-learning-pack` versión de formato 1 es un contenedor declarativo con `manifest.json`, JSON validado y Markdown restringido. El manifiesto fija SemVer, ID, autores, idiomas, dependencias, capacidades, movimientos, entradas, activos con hash/procedencia y versión mínima de aplicación. Admite `integrated` y `local-unsigned`.

Las rutas son relativas, normalizadas y sin traversal. Se rechazan HTML, URL `javascript:`, exceso de tamaño o profundidad y referencias internas rotas. Las escenas usan operaciones y selectores enumerados; su consulta limitada son condiciones de igualdad sobre campos permitidos, nunca código o un lenguaje general.

## Alternativas consideradas

- Componentes React como contenido: flexibles, pero inseguros, no portables y acoplados a la UI.
- Markdown/HTML libre: fácil de autorar, pero permite ejecución y presentación no determinista.
- Firma obligatoria: útil para distribución pública, pero bloquea creación privada offline.

## Consecuencias

Sistema 0 entrega tipos, Zod, JSON Schema, errores claros y fixtures. No entrega ZIP loader, renderer, editor, repositorio remoto ni firma. El mismo contrato funciona sin conexión si paquete y activos están presentes.

## Riesgos

El JSON Schema no expresa todas las referencias cruzadas; el validador semántico es normativo. Los límites de archivo comprimido y ratio ZIP se decidirán al implementar el loader.

## Documentos relacionados

`APRENDER-DECISIONES.md` D07, D09, D12 y D14; `APRENDER-CONTENIDO.md`; `APRENDER-SISTEMA-0.md`.
