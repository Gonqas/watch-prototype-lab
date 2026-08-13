# Plantillas comentadas

Los JSON no contienen claves de comentario porque los contratos son estrictos y rechazan propiedades desconocidas. Este documento es el comentario normativo de las plantillas; los archivos de `minimal/` pueden copiarse sin limpiar anotaciones.

## Convenciones comunes

- `id`: identificador estable, minúsculo y no traducible. Usa prefijos como `route.`, `lesson.`, `scene.` o `competency.`.
- `version`: SemVer. Cambia la versión cuando el significado evaluable o las referencias cambien.
- `{es, en}`: ambos idiomas son obligatorios cuando el manifiesto declara `es-ES` y `en-US`.
- Los arrays de IDs son referencias reales; el validador rechaza referencias rotas.
- G/K/P siempre se declara en tres ejes y con `limitations`.

## Curriculum

`curriculum.json` es la raíz editorial. `routeIds` determina qué rutas publica. No contiene lecciones directamente y no impone linealidad interna.

## Learning path

`learning-path.json` declara propósito, dificultad, prerrequisitos conceptuales, módulos, competencias, movimientos, fuentes y recursos. `demo` solo identifica material demostrativo.

## Module

`module.json` agrupa lecciones. Su propósito explica por qué se agrupan; no debe repetir el propósito completo de la ruta.

## Lesson

La parte base —`title`, `blockIds`, `activityIds`— sigue siendo compatible con los paquetes v1 anteriores. `authoring` añade objetivos, prerrequisitos, conceptos, fuentes y estrategia visual.

Una lección solo necesita `visualStrategy` si su comprensión depende de una representación visual o interactiva. En ese caso son obligatorias la alternativa textual, la alternativa de movimiento reducido, la restauración, la fidelidad y los datos desconocidos.

## Concept

`concept.json` alimenta el mapa de conocimiento. `prerequisiteIds` bloquea o condiciona; `relatedIds` solo conecta. No uses una relación como prerrequisito implícito.

## Terminology entry

La entrada conserva un término base compatible y añade equivalencias ES/EN, sinónimos, términos desaconsejados, contexto y fuentes. Los bloques pueden referenciarla con `{{term:term.id}}`.

## Source reference

Una fuente no almacena necesariamente el documento. `resource.locator` puede ser una URL, referencia privada o ruta editorial. Para un libro privado usa:

- `authority: private-book-theory`;
- `usage: private-local`;
- `resource.kind: book`;
- `sourceType: private-book`;
- `privateUse: true`;
- edición, capítulo, página y figura cuando existan.

Para documentación oficial MIYOTA usa `official-miyota`, `official-linked`, `official-miyota-documentation`, calibre/movimiento y fecha de consulta.

## Technical claim

`claimType` describe el modo de conocimiento: observación, fuente, cálculo, inferencia o hipótesis. `classification` distingue oficial, observado, medido, explicación original, calculado, inferido o hipótesis. Una clasificación `official` exige al menos una fuente `official-miyota`.

`inputFingerprint`, `recordedAt` y `methodVersion` hacen reproducible la afirmación. `reliability: pending` permite redactar sin publicar.

## Activity

La parte base enlaza escena, competencia, evidencia, rúbrica y proyecto de solo lectura. `authoring` aporta metadatos de catálogo, idiomas, capacidades, fuentes, recursos y fidelidad.

`pedagogicalPattern.stages` puede declarar el ciclo Observar–Predecir–Manipular–Ejecutar–Comparar–Explicar–Relacionar–Comprobar–Registrar. Puede omitirse o usar solo las fases pertinentes.

## Question

Las preguntas viven dentro de `scene.steps[].questions`. `responseKind` admite elección simple/múltiple, selección de entidad o texto breve. Si se publica en dos idiomas, añade `authoring.prompt` y `options[].labels`.

## Exercise

Un ejercicio es un `ContentBlock` con `kind: exercise`. Describe acción, resultado observable y límites; las acciones evaluables pertenecen a una actividad, no al Markdown.

## Scene

La escena declara estado inicial, cámara, timeline, overlays, pasos y restauración. No introduce JavaScript. Cada operación del timeline implica capacidades que deben declararse.

Los selectores aceptan identidad, definición, rol, subsistema, calibre, familia, variante, interfaz, etiqueta, tipo de pieza, ensamblaje y consultas compuestas. Añade cardinalidad cuando un resultado ambiguo deba bloquear.

## Scene step

Un paso contiene instrucción, preguntas y condiciones de éxito. La condición puede exigir selección, respuesta o confirmación explícita. El ID debe coincidir con `storyboard.sequence[].sceneStepId`.

## Storyboard

El storyboard está dentro de la escena porque describe exactamente lo que esa escena ejecutará. Sus `timelineIndexes` apuntan al array `timeline`; `runtimeActions` documenta la intención, pero no sustituye las operaciones ejecutables.

## Competency

Una competencia expresa conducta evaluable. Debe tener al menos una plantilla con `extraction` y una rúbrica con `assessmentRule`; de lo contrario `learning:lint` la rechaza.

## Evidence rule

La plantilla conserva `kind` y `scoringMethod` v1. `extraction` define evento disparador, tipo persistente, competencia, estados permitidos, confianza y campos del payload.

## Rubric

`rules` mantiene la regla simple del contrato original. `assessmentRule` es la regla compuesta realmente usada por Sistema 2: condiciones `all`, `any`, `not`, `exists`, `count`, `compare`, `within`, `sequence`, `weighted`, `minimum-evidence` e `independent-later-evidence`.

## Recommendation

Una recomendación declara motivo, regla, prioridad, destino y obligatoriedad. No contiene lógica aleatoria; la aplicación decide si la condición contextual se cumple.

## Visual resource

Todo recurso solicita tipo, propósito, estado, fuente, G/K/P, lecciones, selectores, capacidades, datos, prioridad, dependencias y efecto sobre modelo/viewport. `currentModelSupport` y `viewportImpact` alimentan el informe automático.

## Package manifest

`manifest.json` enumera cada archivo publicable. Una entrada que existe en disco pero no aparece en `entries`, o viceversa, es un error. Los recursos binarios declaran ruta segura, bytes, SHA-256, media type y procedencia.
