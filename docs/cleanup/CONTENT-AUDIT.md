# Auditoría de contenido

| Paquete | ID | Versión | Estado | Archivos | Bytes |
|---|---|---|---|---:|---:|
| `learning-content/example/manifest.json` | `wplab.example.authoring-course` | 1.0.0 | sin declarar | 27 | 108.093 |
| `learning-content/horology-foundations/manifest.json` | `wplab.horology.functional-map` | 0.4.0 | in-review | 152 | 1.933.442 |
| `learning-content/inspection-metrology/manifest.json` | `wplab.horology.inspection-metrology` | 0.1.0 | in-review | 246 | 1.716.164 |
| `learning-content/mechanical-foundations/manifest.json` | `wplab.horology.mechanical-foundations` | 0.4.0 | in-review | 278 | 4.403.304 |
| `learning-content/miyota8215/manifest.json` | `wplab.horology.miyota8215` | 0.4.0 | in-review | 334 | 6.702.013 |
| `learning-content/quartz-miyota2035/manifest.json` | `wplab.horology.quartz-miyota2035` | 0.4.0 | in-review | 201 | 3.246.670 |
| `learning-content/templates/minimal/package-manifest.json` | `wplab.course.example` | 1.0.0 | sin declarar | 22 | 19.687 |

## Decisiones

- Los paquetes actuales son fuente editorial integrada y se conservan.
- No se rebajan sus versiones durante 5A.
- El nuevo paquete de inspección y metrología tendrá ID propio y carga diferida; no se mezclará con los paquetes MIYOTA.
- Los libros privados, PDFs y ZIP originales están ignorados y fuera de este inventario; no se copian ni se abren durante la limpieza.
- Las salidas `dist-*`, previews e informes reproducibles se distinguen de la fuente declarativa.

## Estado final 0.8

`wplab.horology.inspection-metrology@0.1.0` quedó integrado con carga diferida y separado de los paquetes MIYOTA. Sus 14 módulos, 28 actividades y artefactos de informe forman parte de la fuente editorial conservada.
