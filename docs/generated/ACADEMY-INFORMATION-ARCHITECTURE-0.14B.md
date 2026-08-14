# Arquitectura de información 0.14B

## Comparación

| Antes | Después |
|---|---|
| Numerosos destinos competían en la navegación primaria. | Tres destinos primarios: Inicio, Mi ruta y Taller. |
| Las 24 rutas aparecían como entradas equivalentes. | Una ruta principal de ocho etapas; el catálogo completo vive en Biblioteca. |
| 216 módulos unitarios añadían una pantalla intermedia. | La lista de ruta abre directamente la lección; el deep link de módulo conserva un puente compatible. |
| El progreso global mezclaba exposición, práctica y demostración. | Progreso core por anchors y prácticas requeridas; evidencia P y exploración opcional se muestran aparte. |
| No existía una única recomendación dominante. | Inicio aplica recuperación > retención > práctica > lección > capítulo > opcional. |

## Navegación primaria

1. Inicio
2. Mi ruta
3. Taller

Biblioteca es una entrada secundaria y conserva todas las superficies:

- **APRENDER Y PROFUNDIZAR:** Explorar todas las rutas, Ingeniería, Atlas, Repaso.
- **CONSULTAR:** Buscar, Cuaderno, Glosario, Fuentes.
- **GESTIONAR:** Progreso completo, Contenido local, Perfil local, Preferencias.

En móvil se muestran exactamente cuatro destinos: Inicio, Mi ruta, Taller y Biblioteca.

## Catálogo de rutas conservado

| Grupo | Finalidad | Rutas |
|---|---|---:|
| Ruta principal | Rutas fuente que aportan anchors a las ocho etapas. La navegación principal las presenta como capítulos curados. | 15 |
| Especializaciones | Ramas voluntarias que nunca bloquean la columna vertebral mecánica. | 5 |
| Ampliaciones | Contexto y herramientas para profundizar sin inflar el progreso principal. | 2 |
| Casos históricos | Transferencia, restauración y documentación histórica; no se tratan como instrucciones modernas automáticas. | 1 |
| Consulta | Matemáticas, física y metrología disponibles justo cuando una decisión técnica las necesita. | 1 |

Total: 24 rutas visibles, sin IDs omitidos ni duplicados. MIYOTA 2035 figura como especialización no bloqueante.

## Compatibilidad

- Las superficies y hashes históricos continúan resolviéndose mediante el enrutador existente.
- Los IDs de ruta, módulo, lección, actividad, sesión y progreso no cambian.
- Los módulos multi-lección conservan su pantalla; los unitarios conservan su URL como puente.
- Los breadcrumbs de lecciones curadas muestran Etapa > Capítulo > Lección.
- `academyCurriculum.ts` continúa siendo catálogo histórico; no gobierna el denominador de la ruta personal.
