# Academia · QA UX real · 0.14F

| Caso | Viewport | Estado | Resultado | Nota | Captura |
| --- | --- | --- | --- | --- | --- |
| qa.014f.desktop-workstation | 1440 × 1000 | Puesto de trabajo · Aprender · tema oscuro · sin visual activo | passed | Pregunta central única, duración estimada, estado editorial legible y primera pantalla proporcionada. | 01-workstation-learn-1440x1000.png |
| qa.014f.desktop-tools-read | 1024 × 768 | Herramientas · Lectura · tema oscuro · índice compacto | passed | Lectura conserva la pregunta y los visuales esenciales inline; no aparece “authored”. | 02-tools-read-1024x768.png |
| qa.014f.tablet-observation | 760 × 900 | Observación y manipulación · Aprender · compacto | passed | Sin overflow horizontal; pregunta única y práctica personal opcional presente. | 03-observation-learn-760x900.png |
| qa.014f.mobile-contamination | 480 × 900 | Contaminación · Aprender · móvil · sin visual activo | passed | Cabecera, modos y pregunta refluyen sin overflow horizontal. | 04-contamination-learn-480x900.png |
| qa.014f.visual-rail | 1440 × 1000 | Puesto de trabajo · Aprender · rail visual sincronizado | passed | El mapa del banco sigue al apartado activo y declara pregunta, texto alternativo, fidelidad y límites. | 05-bench-map-synchronized-1440x1000.png |
| qa.014f.reflow-bulova | 720 × 1000 | Destreza Bulova · Aprender · visual integrado · reflow equivalente a 200 % | passed | Diagrama inline legible, sin overflow y sin atribuir acreditación física. | 06-bulova-tweezers-reflow-720x1000.png |
| qa.014f.review-desktop | 1440 × 1000 | Revisión personal · cola de 22 · escritorio | passed | Primera pantalla compacta; 0 de 22 valoraciones y ninguna revisión simulada. | 07-personal-review-1440x1000.png |
| qa.014f.review-mobile | 480 × 900 | Revisión personal · cola de 22 · móvil | passed | Selector, estado y pregunta central refluyen sin overflow horizontal. | 08-personal-review-mobile-480x900.png |
| qa.014f.reduced-motion | 1024 × 768 | Herramientas · Aprender · movimiento reducido · visual estático | passed | Preferencia activada y restaurada; el visual esencial permanece como diagrama estático. | 09-tools-reduced-motion-1024x768.png |
| qa.014f.library-entry | 1440 × 1000 | Biblioteca → Gestionar → Revisión personal | passed | La revisión continúa como destino secundario y no aparece en Inicio, Mi ruta ni Taller. | 10-library-manage-review-entry-1440x1000.png |
| qa.014f.home-zero | 1024 × 768 | Inicio · perfil local limpio · progreso cero | passed | Origen local aislado: 0/83 lecciones ancla y siguiente acción en etapa 0. | 11-home-zero-progress-1024x768.png |
| qa.014f.route-stage0 | 1024 × 768 | Mi ruta · etapa 0 · progreso cero | passed | La etapa 0 se muestra como actual sin alterar navegación ni progreso. | 12-my-route-stage0-1024x768.png |
| qa.014f.light-bench | 1024 × 768 | Banco y seguridad · Aprender · tema claro | passed | Tema claro activado y restaurado; contraste y jerarquía se mantienen. | 13-bench-safety-light-1024x768.png |
| qa.014f.keyboard-focus | 1024 × 768 | Puesto de trabajo · foco de teclado | limited | El foco visible sobre controles semánticos se comprobó; el controlador del navegador no reprodujo de forma fiable toda la secuencia Tab/activación. | 14-workstation-keyboard-focus-1024x768.png |
| qa.014f.empty-note | 1024 × 768 | Puesto de trabajo · nota personal vacía | passed | Editor contextual inspeccionado y cancelado sin escribir ni guardar datos. | 15-workstation-empty-note-1024x768.png |
| qa.014f.required-practice | 1024 × 768 | Organizar un banco recuperable · práctica requerida · overlay personal | passed | Presentación 0.14F visible con K/V/R traducidos y límite físico; no se creó intento. | 16-required-practice-overlay-1024x768.png |
| qa.014f.six-lessons | 1024 × 768 | Seis lecciones de etapa 0 · Aprender | passed | Las seis muestran pregunta única, duración estimada, práctica opcional y cero jerga interna detectada. | — |
| qa.014f.six-visuals | 1440 × 1000 | Seis diseños esenciales · apartados activos | passed | Los seis visualDesignId se renderizaron; el mapa de contaminación conserva el ID reutilizado/versionado. | — |
| qa.014f.reading-visuals | 1024 × 768 | Herramientas · Lectura · tres visuales esenciales inline | passed | Eje de observación, pinzas y destornillador permanecen con política inline-essential. | — |
| qa.014f.resume-deep-link | 1024 × 768 | Puesto de trabajo · reanudación de apartado visual | passed | La recarga conservó el deep link y volvió al mismo visual sin completar la lección. | — |
| qa.014f.marker | 1024 × 768 | Puesto de trabajo · marcador | limited | El control y su contexto se inspeccionaron, pero no se activó para evitar crear un marcador ficticio. | — |
| qa.014f.reviewed-state | 1440 × 1000 | Revisión personal · estado revisado | limited | La etiqueta y la transición están cubiertas por pruebas de render; no se inventó una revisión personal para fotografiarla. | — |
| qa.014f.stale-state | 1440 × 1000 | Revisión personal · estado obsoleto | limited | La invalidación por hash está cubierta por pruebas; no se fabricó contenido o revisión obsoleta. | — |
| qa.014f.webgl-fallback | 1024 × 768 | Fallback sin WebGL | limited | La detección y el fallback honesto pasan prueba automática; el navegador disponible no permite desactivar WebGL sin mutar el entorno. | — |
| qa.014f.runtime-console | varios | Navegación rápida entre rutas | limited | Se observaron avisos de rendimiento y errores de versión no creciente del perfil al forzar navegaciones consecutivas; no bloquearon la lectura y se registran como riesgo pendiente. | — |

Capturas encontradas: **16**. El QA no crea notas personales, no marca revisiones como claras y no completa prácticas. El fallback sin WebGL y las reglas de movimiento reducido siguen cubiertos por pruebas automatizadas; los diagramas de etapa 0 no dependen de WebGL.
