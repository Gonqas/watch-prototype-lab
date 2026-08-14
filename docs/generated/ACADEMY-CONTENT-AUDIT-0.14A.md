# Auditoría integral de contenido de la Academia - 0.14A

Resultado: **mapa editorial completo generado; ninguna corrección ambigua aplicada**  
Huella del corpus: `1d209ac9608ca8040222e741401778affac03770b4a51b28ff6e0e2fc44cfd1e`

## Conteos reales visibles

| Paquetes | Rutas | Módulos | Lecciones | Actividades | Conceptos | Errores/misconcepciones |
|---:|---:|---:|---:|---:|---:|---:|
| 8 | 24 | 217 | 222 | 289 | 509 | 149 |

La ruta `route.capstone.validation` y sus 3 módulos/lecciones/actividades están marcados como `demo` y no forman parte del contenido visible. No se fuerza ningún conteo esperado: la matriz se deriva de las rutas reales no-demo.

## Fuentes encontradas y no accesibles

- 189 registros canónicos, incluidos 165 usados directamente por lecciones visibles.
- 7/7 originales locales esperados accesibles y con checksum calculado.
- No accesibles: ninguno.

## Cobertura de citas

| Página/figura | Capítulo/sección | Documento | Ausente |
|---:|---:|---:|---:|
| 101 | 20 | 96 | 5 |

La precisión indica el mejor localizador encontrado por lección; no convierte OCR en verificación visual ni una cita secundaria en autoridad primaria.

## Incidencias por detector

| # | Categoría | Total | Crítica | Alta | Media | Baja | Info |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | Encabezados Markdown vacíos | 37 | 0 | 37 | 0 | 0 | 0 |
| 2 | Secciones declaradas sin contenido | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | Campos ingleses idénticos al español | 222 | 0 | 0 | 222 | 0 | 0 |
| 4 | Título de otra lección dentro del contenido | 47 | 0 | 0 | 47 | 0 | 0 |
| 5 | Objetivos genéricos reutilizados | 52 | 0 | 52 | 0 | 0 | 0 |
| 6 | Párrafos o instrucciones repetidos | 47 | 0 | 0 | 47 | 0 | 0 |
| 7 | Dependencias circulares | 0 | 0 | 0 | 0 | 0 | 0 |
| 8 | Prerrequisitos de nivel superior | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | Conceptos recomendados tratados como obligatorios | 0 | 0 | 0 | 0 | 0 | 0 |
| 10 | Módulos con una sola lección | 216 | 0 | 0 | 0 | 0 | 216 |
| 11 | Nombres redundantes | 216 | 0 | 0 | 0 | 216 | 0 |
| 12 | Citas demasiado amplias | 220 | 0 | 0 | 220 | 0 | 0 |
| 13 | Datos numéricos sin localizador aplicable | 120 | 0 | 120 | 0 | 0 | 0 |
| 14 | Fórmulas OCR sin verificación visual | 66 | 66 | 0 | 0 | 0 | 0 |
| 15 | Procedimientos históricos peligrosos | 44 | 44 | 0 | 0 | 0 | 0 |
| 16 | Procedimientos que necesitan fuente moderna de seguridad | 89 | 89 | 0 | 0 | 0 | 0 |
| 17 | Habilidad física evaluada solo digitalmente | 76 | 76 | 0 | 0 | 0 | 0 |
| 18 | Apoyo visual inadecuado para el arquetipo | 154 | 0 | 154 | 0 | 0 | 0 |
| 19 | Visual declarado sin desarrollar | 0 | 0 | 0 | 0 | 0 | 0 |
| 20 | Contenido excesivamente condicionado por plantillas | 99 | 0 | 99 | 0 | 0 | 0 |
| 21 | Segmentación automática potencialmente disruptiva | 145 | 0 | 0 | 145 | 0 | 0 |
| 22 | Contenido de calibre sustentado solo por teoría general | 7 | 0 | 7 | 0 | 0 | 0 |
| 23 | Base secundaria tratada como documentación oficial | 4 | 4 | 0 | 0 | 0 | 0 |
| 24 | Trabajo especializado clasificado como doméstico | 20 | 20 | 0 | 0 | 0 | 0 |
| 25 | Original o extracción rastreado accidentalmente | 0 | 0 | 0 | 0 | 0 | 0 |

## Lecturas obligatorias de la auditoría

- Problemas de prerrequisitos: 0.
- Problemas de idioma: 222.
- Encabezados vacíos: 37.
- Contenido duplicado: 47.
- Objetivos genéricos: 52.
- Lecciones sin visuales adecuados: 154.
- Habilidades físicas sin evidencia física: 76.
- Procedimientos históricos peligrosos: 44.
- Fórmulas OCR sin verificar: 66.
- Módulos de una sola lección: 216.

## Top 30 de prioridades editoriales

| Pos. | Puntos | Prioridad | Lección | Ruta | Acción | Motivo resumido |
|---:|---:|---|---|---|---|---|
| 1 | 94 | critical | `lesson.miyota8215.inspection` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 2 | 93 | critical | `lesson.miyota8215.diagnosis-project` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. La lección comparte párrafos o instrucciones extensos con otras lecciones. Los nombres de módulo y lección son redundantes. |
| 3 | 90 | critical | `lesson.capstone.manufacturing.dfm-datums` | `route.capstone.manufacturing-finishing` | manual-review | Campos localizados en inglés repiten literalmente el español. El objetivo es genérico, no observable o se reutiliza de forma extensa. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. |
| 4 | 84 | critical | `lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto` | `route.encyclopedia.atlas-restoration-design` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |
| 5 | 80 | critical | `lesson.encyclopedia.history-language.medir-el-tiempo` | `route.encyclopedia.history-language` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Hay datos numéricos o relaciones cuantitativas sin página, figura o tabla aplicable. |
| 6 | 80 | critical | `lesson.encyclopedia.history-language.industrializacion-y-familias` | `route.encyclopedia.history-language` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Hay datos numéricos o relaciones cuantitativas sin página, figura o tabla aplicable. |
| 7 | 80 | critical | `lesson.encyclopedia.history-language.transicion-electromecanica-cuarzo` | `route.encyclopedia.history-language` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Hay datos numéricos o relaciones cuantitativas sin página, figura o tabla aplicable. |
| 8 | 79 | high | `lesson.encyclopedia.history-language.evolucion-de-los-escapes` | `route.encyclopedia.history-language` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |
| 9 | 78 | high | `lesson.quartz2035.workstation` | `route.horology.bench-foundations` | manual-review | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. El objetivo es genérico, no observable o se reutiliza de forma extensa. |
| 10 | 78 | high | `lesson.quartz2035.tools` | `route.horology.bench-foundations` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. El objetivo es genérico, no observable o se reutiliza de forma extensa. |
| 11 | 78 | high | `lesson.quartz2035.observe` | `route.horology.bench-foundations` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. El objetivo es genérico, no observable o se reutiliza de forma extensa. |
| 12 | 78 | high | `lesson.encyclopedia.workshop-tools-materials.herramientas-y-afilado` | `route.encyclopedia.workshop-tools-materials` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |
| 13 | 78 | high | `lesson.encyclopedia.workshop-tools-materials.tratamiento-termico-y-superficies` | `route.encyclopedia.workshop-tools-materials` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |
| 14 | 78 | high | `lesson.encyclopedia.workshop-tools-materials.chicago-herramientas-seleccion` | `route.encyclopedia.workshop-tools-materials` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |
| 15 | 78 | high | `lesson.miyota8215.identify` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 16 | 78 | high | `lesson.miyota8215.documentation` | `route.miyota8215.complete` | manual-review | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 17 | 78 | high | `lesson.miyota8215.architecture` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 18 | 78 | high | `lesson.miyota8215.automatic` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 19 | 78 | high | `lesson.miyota8215.winding-setting` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 20 | 78 | high | `lesson.miyota8215.calendar` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 21 | 78 | high | `lesson.miyota8215.barrel-energy` | `route.miyota8215.complete` | manual-review | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. La lección comparte párrafos o instrucciones extensos con otras lecciones. Los nombres de módulo y lección son redundantes. |
| 22 | 78 | high | `lesson.miyota8215.train` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 23 | 78 | high | `lesson.miyota8215.escapement-oscillator` | `route.miyota8215.complete` | manual-review | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 24 | 78 | high | `lesson.miyota8215.plan-disassembly` | `route.miyota8215.complete` | manual-review | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. La lección comparte párrafos o instrucciones extensos con otras lecciones. Los nombres de módulo y lección son redundantes. |
| 25 | 78 | high | `lesson.miyota8215.guided-disassembly` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 26 | 78 | high | `lesson.miyota8215.assisted-free-disassembly` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. La lección comparte párrafos o instrucciones extensos con otras lecciones. Los nombres de módulo y lección son redundantes. |
| 27 | 78 | high | `lesson.miyota8215.assembly-verification` | `route.miyota8215.complete` | edit | La lección contiene encabezados sin contenido verificable. Campos localizados en inglés repiten literalmente el español. El cuerpo contiene el título de otra lección; puede ser referencia válida o contaminación de plantilla. La lección comparte párrafos o instrucciones extensos con otras lecciones. |
| 28 | 77 | high | `lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad` | `route.encyclopedia.workshop-tools-materials` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |
| 29 | 77 | high | `lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion` | `route.encyclopedia.workshop-tools-materials` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |
| 30 | 77 | high | `lesson.encyclopedia.workshop-tools-materials.materiales-relojeros` | `route.encyclopedia.workshop-tools-materials` | manual-review | Campos localizados en inglés repiten literalmente el español. Los nombres de módulo y lección son redundantes. Una o más fuentes se citan a nivel de capítulo, documento o sin localizador. Una fórmula vinculada a material OCR no consta como verificada visualmente. |

## Recomendaciones por etapa

- **0-prepare-bench-and-control**: 12 lecciones. Priorizar empty-markdown-headings, identical-english-spanish, foreign-lesson-title, generic-reused-objective.
- **1-understand-watch-as-system**: 15 lecciones. Priorizar identical-english-spanish, foreign-lesson-title, overbroad-citation, numeric-data-without-locator.
- **2-understand-mechanical-systems**: 67 lecciones. Priorizar empty-markdown-headings, identical-english-spanish, foreign-lesson-title, generic-reused-objective.
- **3-observe-measure-diagnose**: 41 lecciones. Priorizar identical-english-spanish, redundant-names, overbroad-citation, numeric-data-without-locator.
- **4-work-on-real-calibre**: 22 lecciones. Priorizar empty-markdown-headings, identical-english-spanish, foreign-lesson-title, generic-reused-objective.
- **5-build-complete-watch**: 3 lecciones. Priorizar identical-english-spanish, generic-reused-objective, redundant-names, overbroad-citation.
- **6-repair-adapt-manufacture-components**: 56 lecciones. Priorizar identical-english-spanish, redundant-names, overbroad-citation, ocr-formula-unverified.
- **7-design-validate-own-watch-or-movement**: 6 lecciones. Priorizar identical-english-spanish, generic-reused-objective, redundant-names, overbroad-citation.

## Limitaciones de la auditoría

- Es un análisis declarativo y heurístico. Una incidencia señala revisión; no prueba por sí sola que el contenido sea incorrecto.
- No se evaluó destreza física, transferencia real, retención longitudinal ni seguridad de un taller concreto.
- OCR se usó para localizar y clasificar, nunca como prueba suficiente de fórmulas, símbolos, tablas o medidas.
- La presencia de una fuente no demuestra que cada frase esté respaldada al nivel correcto.
- Las fotografías y casos externos siguen sujetos a derechos, contexto y verificación del ejemplar.
- No se modificaron navegación, lector, segmentación, progreso, rutas ni contenido visible.

## Elementos que exigen revisión humana

- Todas las incidencias críticas o altas de seguridad, OCR, autoridad de calibre y datos numéricos.
- Toda habilidad física cuyo nivel recomendado sea P o R.
- Chicago completo como corpus histórico; en especial lecciones 10, 27, 32b y 35.
- Todos los capítulos de Daniels con fórmulas/tablas; especialmente ruedas/piñones, escapes, diseño, volante/espiral y apéndices.
- Conflictos de metadatos entre variantes de un mismo `sourceId`.
- Las 222 lecciones marcadas con revisión manual en la matriz.
