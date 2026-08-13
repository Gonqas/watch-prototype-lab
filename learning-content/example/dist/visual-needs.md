# Informe de necesidades visuales

Paquete: `wplab.example.authoring-course@1.0.0`

| Recurso | Lecciones | Tipo | Movimiento | Piezas/selectores | Capacidades | Datos necesarios | Estado | Prioridad | Fidelidad | Modelo actual | Viewport | Dependencias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| visual.authoring.selector-text-alternative | lesson.authoring.traceability | accessible-text-alternative | — | {"by":"role","value":"case"} | canonical-selectors-v1 | Etiqueta accesible e ID estable de la entidad resuelta. | approved | critical | G0/K0/P0 | yes | none | — |
| visual.authoring.selector-scene | lesson.authoring.traceability | conceptual-3d | — | {"by":"role","value":"case"} | viewport.selection, viewport.isolation, viewport.highlight, viewport.explode, viewport.camera | Una entidad del proyecto con el rol semántico case. | ready | high | G2/K1/P0 | yes | configuration | visual.authoring.selector-text-alternative |
