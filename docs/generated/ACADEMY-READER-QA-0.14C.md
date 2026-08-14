# QA del lector continuo — 0.14C

| Caso | Estado | Lección | Viewport | Resultado | Evidencia |
|---|---|---|---|---|---|
| qa.01 | Lección conceptual corta | lesson.advanced.calendars | 1440x1000 | pass-browser | Lector real: 8 secciones, 5.607 caracteres, sin overflow horizontal. |
| qa.02 | Lección extensa | lesson.encyclopedia.cases-water.arquitectura-de-caja | 1440x1000 | pass-browser | Lector real: 11 secciones, 8.029 caracteres y CTA final visible; sin overflow. |
| qa.03 | Diez o más secciones | lesson.miyota8215.guided-disassembly | 1024x768 | pass-browser | Lector real: 17 secciones, índice compacto y práctica bloqueada explicada. |
| qa.04 | Lección sin visual | lesson.encyclopedia.history-language.medir-el-tiempo | 1024x768 | pass-browser | Lector real: 11 secciones, cero figure y ningún rail o placeholder visual vacío. |
| qa.05 | Escena 3D | lesson.miyota8215.architecture | 1024x768 | pass-browser | Canvas real cargado al activar «Visual e interacción»; texto, caption, fidelidad y límites siguieron visibles. |
| qa.06 | Varios cues | lesson.horology.mechanical-chain | 1024x768 | pass-browser | Scrollspy real cambió el cue de «Explicación principal» a «Ejemplo» sin abrir actividad evaluada. |
| qa.07 | Tabla Markdown | fixture controlado | 1024x768 | pass-fixture | El corpus visible no contiene tabla Markdown authored; fixture AST renderiza table/th/td y listas anidadas. Limitación explícita: no existe estado real que inspeccionar. |
| qa.08 | Fórmula no verificada preservada | lesson.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio | 1024x768 | pass-fixture | La incidencia OCR sigue vinculada en 0.14A.1; el lector real no creó nodos MathML/KaTeX ni scripts y el fixture conserva la cadena literal. |
| qa.09 | Fuentes desplegadas | lesson.horology.functional-equivalence | 760x900 | pass-browser | Dos grupos secundarios cerrados por defecto; «Fuentes» abrió desde el índice, quedó aria-current y devolvió foco a Índice. |
| qa.10 | Reanudación intermedia | lesson.horology.mechanical-chain | 1024x768 | pass-browser | «Explicación visual» se guardó, se abandonó la ruta y se restauró en el mismo apartado (scroll 2.056 px). |
| qa.11 | Deep link de segmento antiguo | lesson.horology.mechanical-chain | 1024x768 | pass-browser | ?segment=block.horology.mechanical-chain.segment.orient.1 abrió «Propósito» sin error fatal. |
| qa.12 | Modo Aprender | lesson.horology.mechanical-chain | 1440x1000 | pass-browser | Modo Aprender real con outline, copia y visual sincronizado; sin main anidado ni overflow. |
| qa.13 | Modo Lectura | lesson.horology.mechanical-chain | 1024x768 | pass-browser | Modo Lectura real eliminó figures y mantuvo contenido, sección activa y finalización. |
| qa.14 | Cambio entre modos | lesson.horology.mechanical-chain | 480x900 | pass-browser | Cambio Aprender→Lectura conservó «Conocimientos previos» y reancló el apartado tras cambiar la altura del documento. |
| qa.15 | Finalización con práctica | lesson.horology.system | 1024x768 | pass-browser | Perfil QA temporal: el CTA explícito creó «Lección estudiada» y conservó la relación con la práctica requerida. |
| qa.16 | Finalización sin práctica | fixture controlado | 1024x768 | pass-fixture | Las 222 lecciones actuales declaran práctica; el contrato sin requiredActivityIds se valida mediante fixture y consulta academyNextAction. No se inventó un estado visible. |
| qa.17 | Práctica bloqueada | lesson.horology.system | 480x900 | pass-browser | Estado real: la lección pudo cerrarse, la práctica permaneció bloqueada y se mostró enlace al requisito del capítulo. |
| qa.18 | Fallo controlado del modelo | lesson.miyota8215.architecture | 1024x768 | pass-fixture | La carga real produjo canvas; el rechazo controlado de createSceneComposition está cubierto por el fallback independiente del texto. No se inyectó un fallo en datos del usuario. |
| qa.19 | Perfil histórico en-US con español efectivo | lesson.horology.system | 480x900 | pass-fixture | El selector real mantiene English deshabilitado como traducción pendiente; la normalización histórica en-US→es efectivo queda cubierta por compatibilidad sin crear un perfil falso. |
| qa.20 | Lección completada previamente | lesson.horology.system | 1024x768 | pass-browser | Perfil QA temporal: tras salir y volver, «Lección estudiada» permaneció. El perfil temporal se eliminó luego con su token exacto. |
| qa.21 | Lección legacy-inferred | lesson.horology.system | 200%-reflow | pass-fixture | No había perfil legacy-inferred local; la política versionada y el corte exacto se verifican con fixture sin reescribir sesiones. |
| qa.22 | Etapa 5 con cobertura parcial | lesson.encyclopedia.cases-water.arquitectura-de-caja | 200%-reflow | pass-browser | Mi ruta mostró cobertura parcial/planificada de etapa 5 a 720×450, equivalente de reflow; overflow horizontal 0. |

## Resumen por viewport

- 1440x1000: 3 en navegador real, 0 mediante fixture explícito, 0 fallos.
- 1024x768: 9 en navegador real, 4 mediante fixture explícito, 0 fallos.
- 760x900: 1 en navegador real, 0 mediante fixture explícito, 0 fallos.
- 480x900: 2 en navegador real, 1 mediante fixture explícito, 0 fallos.
- 200%-reflow: 1 en navegador real, 1 mediante fixture explícito, 0 fallos.

## Rendimiento observado

- Método: `in-app-browser-warm-dev-cache-node-orchestration`, viewport 1024x768.
- Texto utilizable: **183 ms**.
- Canvas interactivo del piloto 8215: **1465 ms**; 1 canvas montado.
- Memoria JS: **no disponible** en esta sesión. performance.memory no está disponible en esta sesión; no se inventa una aproximación de heap.
- Chunk lector: 189.19 kB (57.91 kB gzip) JS y 8.86 kB (2.12 kB gzip) CSS.
- Carga 3D separada: loader 1.51 kB, viewport 26.72 kB y fixtures 35.83 kB.
- Limitación: Cifras orientativas de una ejecución local caliente; no son un benchmark de producción ni una métrica de aprendizaje.

`pass-browser` exige inspección en el navegador integrado. `pass-fixture` identifica estados ausentes del corpus o del perfil local y conserva la limitación; no se presenta como juicio visual subjetivo.
