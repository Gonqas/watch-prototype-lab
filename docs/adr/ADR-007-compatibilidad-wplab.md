# ADR-007 — Compatibilidad aditiva `.wplab`

- Estado: Aceptada
- Fecha: 2026-07-22
- Sistemas afectados: importación/exportación, manifiestos, sesiones/evidencias compartidas y compatibilidad histórica.

## Contexto

`.wplab` versión de paquete 1 ya contiene `manifest.json`, `project.json` y opcionalmente informes. Cambiar el contenedor obligatorio rompería lectores y proyectos existentes.

## Decisión

Sistema 0 no cambia el formato ni el encoder. Define `LearningDossierManifest` para una entrada opcional futura y una selección explícita de sesiones y evidencias exportables. Un dossier no incluye por defecto perfil, progreso completo, tutor, PDFs privados, cachés ni activos de licencia desconocida.

La compatibilidad se apoya en entradas ZIP aditivas: el lector actual solo exige manifiesto y proyecto e ignora las demás. El manifiesto principal seguirá en versión 1 hasta que un cambio obligatorio requiera otra versión; añadir un dossier opcional no provoca ese salto.

## Alternativas consideradas

- Incluir todo el perfil en cada proyecto: facilita traslado, pero filtra datos y duplica estado global.
- Elevar ya `packageVersion`: hace visible la novedad, pero rompe compatibilidad sin necesidad.
- Contenedor educativo separado únicamente: reduce acoplamiento, pero impide compartir evidencia seleccionada con un proyecto.

## Consecuencias

Los contratos distinguen referencias de datos embebidos y aplican exclusión por defecto. Sistema 0 prueba que el decoder actual tolera una entrada educativa desconocida. Persistencia, consentimiento y UI de exportación quedan pendientes.

## Riesgos

Lectores externos podrían rechazar entradas desconocidas pese al comportamiento de esta aplicación. La interoperabilidad externa deberá verificarse antes de distribuir dossiers.

## Documentos relacionados

`APRENDER-DECISIONES.md` D13 y D15; `APRENDER-ARQUITECTURA.md`; `APRENDER-SISTEMA-0.md`.
