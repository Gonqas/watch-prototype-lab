# Auditoria y modulos marcados - Watch Prototype Lab

Fecha: 2026-06-21

## Estado verificado

- `npm run verify` pasa: lint, tests y build correctos.
- Tests actuales: 5 archivos, 16 tests pasados.
- El build genera un aviso de chunk grande: `index-*.js` queda en torno a 1.276 MB sin gzip. No rompe la app, pero confirma que conviene modularizar antes de seguir creciendo.

## Hallazgos principales

### P1 - La app ya funciona, pero esta demasiado concentrada

Archivos criticos demasiado grandes:

- `src/components/WatchViewer.tsx`: visor, modelos, gizmos, camara, heatmap y escena en un solo archivo.
- `src/App.tsx`: layout, paneles, stack lab, inspector, variantes y overlay en un solo archivo.
- `src/store/useLabStore.ts`: estado de diseno, UI, historial, presets, mediciones, libreria y variantes mezclados.
- `src/logic/validation.ts`: reglas, oportunidades y colisiones aproximadas en un bloque unico.

Riesgo: cualquier mejora profesional de UX o motor tecnico obliga a tocar demasiadas piezas a la vez.

### P1 - El motor tecnico aun es aproximado

El stack vertical se calcula con pocas cotas base en `src/logic/watchStack.ts`, sin planos de referencia completos, tolerancias o datums por pieza.

La validacion de colisiones usa reglas y muestreos aproximados. Por ejemplo, la altura maxima de agujas se obtiene con pocos puntos de muestra, y los conflictos relieve/agujas se aproximan por radio y altura.

Riesgo: para una herramienta profesional, el usuario podria confiar en una viabilidad que aun no esta suficientemente modelada.

### P1 - La UX todavia no es "editor profesional por pieza"

Ya existen modos de trabajo, foco, aislamiento y gizmos, pero la experiencia sigue siendo hibrida: configurador, editor, laboratorio y panel tecnico compiten en la misma pantalla.

Riesgo: seleccionar y editar una pieza concreta puede sentirse mas dificil de lo necesario, especialmente con muchas capas visibles.

### P1 - Datos parciales no gobiernan suficiente la experiencia

La app distingue `data_quality`, pero las mediciones reales y los datos faltantes aun no transforman por completo el motor, los avisos y la prioridad visual.

Riesgo: los datos de proveedor parcial, estimados y medidos por usuario pueden parecer mas equivalentes de lo que deberian.

### P2 - El proyecto inicial no representa del todo "desde cero"

El diseno por defecto incluye relieves (`DEFAULT_RELIEFS`). Para un flujo profesional desde cero, el baseline deberia ser un reloj completo pero limpio, sin decoracion experimental preinsertada.

Riesgo: se mezcla "plantilla base" con "ejemplo de estres tecnico".

### P2 - Las oportunidades aun pueden sonar a solucion automatica

El comparador de variantes y algunas oportunidades proponen vias como 2 agujas, cristal box o bajar relieve. Son utiles, pero deben presentarse como escenarios manuales de prueba, no como recomendaciones automaticas.

Riesgo: contradice parcialmente la preferencia de no recibir soluciones automaticas.

### P2 - Falta pipeline real de fabricacion

Stack Lab ya marca candidatos de fabricacion, pero no existe todavia un modulo de preparacion para impresion 3D/CNC: tolerancias, minimos imprimibles, holguras, exportaciones y revision de geometria.

Riesgo: la herramienta ayuda a explorar, pero aun no acompana el paso hacia pieza fabricable.

## Modulos marcados para implementar

## Avance implementado - 2026-06-21

- M01 iniciado: se separo parte del nucleo tecnico en modulos dedicados (`geometryKernel`, `collisionEngine`, `fabrication`, `designMigration`, `projectTemplates`).
- M02 iniciado: existe un Geometry Kernel compartido para agujas, relieves, superficies locales, radios y calidad combinada.
- M03 iniciado: Stack Engine v2 expone planos de referencia, intervalos tecnicos y supuestos, manteniendo compatibilidad con la UI actual.
- M04 iniciado: Collision & Sweep Engine v1 calcula margenes, gaps entre agujas y choques relieve/barrido antes de generar mensajes de validacion.
- M08 implementado: el proyecto base Miyota 2035 arranca limpio; dial hundido, 2 agujas, relieve limite y dial imprimible son plantillas explicitas.
- M10 iniciado: Fabrication Prep v1 separa checks de dial/caja/agujas/movimiento/cristal y lista datos criticos pendientes.
- M12 iniciado: los disenos cargados pasan por normalizacion de esquema para soportar campos nuevos sin romper proyectos previos. El visor 3D carga en chunk diferido.

Verificacion posterior: `npm run verify` pasa con lint, 9 archivos de test, 24 tests y build. Bundle principal reducido a unos 298 KB; el chunk pesado queda aislado en `WatchViewer`.

## Pasada UX - 2026-06-21

- Primer nivel mas limpio: el fondo visual se simplifico y se redujo ruido decorativo.
- El visor muestra menos tarjetas simultaneas; el estado duplicado se retiro del overlay principal.
- La seleccion de piezas sube al primer viewport con una barra rapida: caja, dial, agujas y cristal.
- Hipotesis rapidas y experimentos quedan plegados en la bandeja inferior para no competir con la edicion principal.
- Los modos de trabajo pasan a una fila desplazable mas legible; las barras de scroll internas decorativas quedan ocultas.
- Textos de variantes cambiados a lenguaje de prototipado manual: "Probar variante" en vez de "Aplicar ruta".
- Verificacion posterior: `npm run verify` pasa con lint, 9 archivos de test, 24 tests y build.

## Dial Studio v2 - 2026-06-21

- Dial Lab entra directamente en modo taller, selecciona el dial, activa herramienta de profundidad y abre vista de seccion.
- El inspector derecho muestra Dial Studio con controles grandes para hundimiento, radio central, anillo exterior, margenes dial/agujas, cristal y espacio de anillo exterior.
- La barra rapida de piezas sube encima del visor para cambiar entre caja, dial, agujas y cristal sin bajar pantalla.
- Relieves pasan a tener una lista de estudio: crear, seleccionar y cambiar herramienta entre mover, altura y tamano.
- Dial Studio queda visible en el primer viewport; se verifico visualmente en navegador local.
- Verificacion posterior: `npm run verify` pasa con lint, 9 archivos de test, 25 tests y build.

### M01 - Arquitectura profesional del workbench

Prioridad: critica.

Separar:

- `viewer/scene`
- `viewer/models`
- `viewer/gizmos`
- `viewer/camera`
- `viewer/heatmap`
- `ui/layout`
- `ui/workbenches`
- `ui/inspector`
- `store/slices`

Resultado esperado: poder evolucionar visor, paneles y motor sin romper media app.

### M02 - Geometry Kernel v1

Prioridad: critica.

Crear una capa central de geometria tecnica:

- solidos simplificados por pieza;
- envelopes;
- planos de referencia;
- bounding volumes;
- signed clearances;
- volumen barrido de agujas;
- metadatos de fiabilidad por calculo.

Resultado esperado: que la validacion use geometria comun, no reglas sueltas.

### M03 - Stack Engine v2

Prioridad: critica.

Sustituir el stack vertical simple por un modelo con:

- datum de fondo de caja;
- asiento de movimiento;
- asiento de dial;
- plano superior de dial;
- alturas reales/estimadas de canon y tubo;
- superficie interior del cristal;
- volumen interior de caja;
- tolerancias y estado de dato.

Resultado esperado: vista tecnica fiable para jugar con limites verticales.

### M04 - Collision & Sweep Engine v1

Prioridad: alta.

Implementar motor de colisiones dedicado:

- agujas contra relieve;
- agujas contra dial;
- agujas entre si;
- agujas contra cristal;
- relieve contra volumen barrido;
- movimiento/caja;
- dial/caja;
- tija/corona;
- fondo/movimiento/holder.

Resultado esperado: conflictos visuales rojos, editables y medibles, sin bloquear la creatividad.

### M05 - Piece Studios v2

Prioridad: alta.

Crear bancos de edicion separados:

- Assembly Studio: reloj completo.
- Stack Lab: seccion y capas.
- Dial Studio: dial aislado, relieves, hundimientos, anillos.
- Hands Studio: curvas, alturas, longitud, barrido.
- Case/Crystal Studio: caja, interior, cristal, fondo.
- Stem/Crown Studio: tija, tubo, corona, alineacion.
- Measurement Studio: datos reales.

Resultado esperado: editar una pieza como herramienta profesional y volver al montaje completo.

### M06 - Interaccion 3D profesional

Prioridad: alta.

Mejorar el control directo:

- seleccion por arbol/lista antes que pinchar en geometria;
- hit priority por pieza activa;
- bloqueo de seleccion accidental;
- handles de altura, radio, diametro, posicion y curva;
- snap claro;
- ghost del resto;
- gizmos especificos por pieza;
- feedback visual inmediato al llegar a limites.

Resultado esperado: que se sienta como editor 3D tecnico, no solo como formulario con visor.

### M07 - Lenguaje visual tecnico

Prioridad: alta.

Definir un sistema visual mas legible:

- paleta por pieza con contraste real;
- materiales tecnicos distintos;
- errores rojos solo para colision;
- oportunidades azul/cian/morado;
- datos pendientes con patron o borde;
- menos ruido en primer nivel;
- overlay contextual segun pieza.

Resultado esperado: entender de un vistazo que es caja, dial, aguja, cristal, oportunidad o conflicto.

### M08 - Plantillas y proyectos desde cero

Prioridad: media-alta.

Separar:

- plantilla base limpia;
- plantilla tecnica Miyota 2035;
- preset con caja WP24;
- experimento dial hundido;
- experimento 2 agujas;
- experimento relieve limite.

Resultado esperado: empezar desde un reloj completo limpio y elegir cuando entrar en experimentos.

### M09 - Data Quality & Measurements v2

Prioridad: media-alta.

Convertir las mediciones en una capa fuerte:

- ficha por pieza;
- dato oficial vs proveedor vs estimado vs medido;
- checklist de datos criticos;
- historial de mediciones;
- confianza por validacion;
- avisos de "validacion parcial" mas utiles.

Resultado esperado: la herramienta aprende con piezas reales y no inventa precision.

### M10 - Fabrication Prep v1

Prioridad: media.

Preparar la ruta hacia impresion 3D:

- dial como primera pieza exportable;
- checks de grosor minimo;
- tolerancias para agujero central y pies;
- relieve imprimible;
- separacion de apliques;
- margen para resina/FDM/SLA;
- preview de pieza fabricable.

Resultado esperado: pasar de exploracion a candidato imprimible.

### M11 - Prototipos, variantes y comparador

Prioridad: media.

Refinar variantes como escenarios manuales:

- duplicar estado actual;
- comparar A/B/C;
- diff tecnico;
- snapshot visual;
- historial de decisiones;
- etiquetas: viable, justo, experimental, bloqueado.

Resultado esperado: explorar muchas versiones sin perder el camino.

### M12 - Persistencia, versionado y rendimiento

Prioridad: media.

Implementar:

- migraciones de schema;
- import/export robusto;
- autosave;
- recuperacion;
- code splitting;
- lazy loading de workbenches;
- tests por modulo.

Resultado esperado: app mas robusta y lista para crecer.

## Orden recomendado

1. M01 + M08: ordenar base y flujo desde cero.
2. M02 + M03: crear nucleo tecnico serio.
3. M04 + M06 + M07: convertirlo en editor 3D profesional y claro.
4. M05: separar estudios por pieza con montaje completo.
5. M09 + M10: mediciones reales y fabricacion.
6. M11 + M12: variantes, persistencia y rendimiento.

## Definicion de "siguiente nivel"

La app debe pasar de "configurador visual avanzado" a "laboratorio tecnico de relojes". La experiencia principal deberia ser:

1. Empiezo con un reloj completo limpio.
2. Selecciono una pieza desde lista/arbol.
3. La edito aislada o con el resto transparente.
4. Veo limites tecnicos en tiempo real.
5. Puedo mantener una pieza mal colocada.
6. La app me dice que dato falta, que pieza limita y cuanto margen tengo.
7. Guardo variantes y vuelvo al montaje completo.
8. Preparo primero diales para impresion 3D.
