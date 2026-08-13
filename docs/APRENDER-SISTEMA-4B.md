# Aprender · Sistema 4B

## Estado

Sistema 4B implementa la base técnica y visual del primer curso real sin redactar ni convertir contenido pedagógico. El currículo, las lecciones, las preguntas y las rúbricas quedan bajo autoría externa.

Fecha de verificación de fuentes: **2026-07-23**.

## Alcance entregado

- registro oficial curado para MIYOTA 2035 y MIYOTA 8215;
- contrato vacío para añadir posteriormente 82S0, 8N24, 9015, 9039, 9100 y 9120;
- jerarquía estricta de procedencia para datos, geometría y relaciones;
- ledger de reconstrucción por pieza;
- cuatro fixtures técnicos separados;
- ensamblajes canónicos v6 estructurales de 2035 y 8215;
- selectores semánticos estables y cardinalidad comprobable;
- relaciones funcionales consultables;
- estado visual reversible y restaurable;
- fixture coordinado para `module.horology.functional-map`;
- informe visual JSON/Markdown;
- pruebas de procedencia, integridad, reversibilidad, serialización y ausencia de dimensiones inventadas;
- inclusión literal de los cuatro documentos editoriales externos.

No se han creado lecciones, currículo ejecutable, preguntas, rúbricas, tutor, OCR, visor PDF, editor visual ni modelos adicionales de la familia MIYOTA.

---

## 1. Auditoría inicial de Sistemas 0–4A

La inspección se realizó antes del primer cambio de código.

### Base disponible

- Sistema 0 fijó contratos, compatibilidad y límites de Aprender.
- Sistema 1 aportó modelo canónico v6, `ProjectEntityIndex`, selectores e interfaces/dependencias.
- Sistema 2 aportó escenas declarativas, compilador, runtime, timeline, reduced motion y un overlay restaurable.
- Sistema 3 aportó persistencia separada para progreso, sesiones y evidencias.
- Sistema 4A aportó kit de autoría, validadores, previsualización y empaquetado, pero solo con contenido demostrativo de autoría.

### Estado real encontrado

| Recurso previo | Estado real antes de 4B | Conclusión |
|---|---|---|
| `createQuartzProject('miyota_2035')` | Proyecto técnico v5 con envolvente y datos generales | No era un ensamblaje de piezas del 2035 |
| viewport de cuarzo | Pila, bobina y rotor dibujados dentro del grupo visual `movement` | No permitía selección individual canónica |
| CAD de cuarzo | cuerpo y pila fusionados en una pieza CAD | Envolvente, no gemelo |
| `createMiyotaMechanicalStudy('8215')` | Arquitectura scratch genérica con envolvente y parámetros oficiales del 8215 | No representaba los componentes internos del 8215 |
| fixture semántico 8215 | referencia documental sin piezas | Útil para identidad, insuficiente para una escena real |
| `StudioViewportLearningBridge` | selección, visibilidad, aislamiento, resaltado y explosionado con granularidad v5 | No renderiza aún instancias v6 arbitrarias |
| overlays | etiquetas 2D y estado reversible | Faltan anclajes espaciales para etiquetas y flechas |
| runtime | timeline absoluto, pausa, scrub, reduced motion y restauración | Reutilizable |

El nombre de una pieza, un preset de calibre o una malla agrupada no se contabilizó como modelo individual utilizable.

### Operaciones ejecutables antes de 4B

- selección y visibilidad por tipos visuales v5;
- aislamiento y resaltado no destructivos;
- explosionado global;
- transparencia parcial;
- etiquetas 2D sin anclaje espacial;
- timeline, pausa, scrub y reduced motion;
- captura y restauración del overlay.

No estaban disponibles:

- renderer de instancias v6 arbitrarias;
- composición simultánea de cuatro fixtures;
- flechas ancladas a piezas;
- ruta energética dibujada;
- trayectorias individuales de desmontaje;
- transparencia independiente garantizada para todos los submeshes.

---

## 2. Blueprint editorial externo

Los documentos entregados se incluyen sin convertirlos en JSON ejecutable:

- `learning-content/horology-foundations/blueprint/CURRICULO-MAESTRO-HOROLOGIA-v0.1.md`
- `learning-content/horology-foundations/blueprint/DECISIONES-EDITORIALES-v0.1.md`
- `learning-content/horology-foundations/blueprint/PLAN-VISUAL-MIYOTA-v0.1.md`
- `learning-content/horology-foundations/blueprint/PRIMER-MODULO-ESPECIFICACION-v0.1.md`

Sistema 4B usa únicamente sus identificadores, necesidades técnicas y separaciones de modelo. No interpreta, reescribe ni amplía sus decisiones pedagógicas.

---

## 3. Fuentes oficiales

El registro `MIYOTA_OFFICIAL_SOURCE_REGISTRY` vive en `src/learning/technical/officialSources.ts`.

### MIYOTA 2035

- página oficial;
- specification;
- drawing;
- instruction manual;
- parts list and exploded view.

Datos curados:

- tamaño 6 3/4 × 8 líneas;
- anchura 15,3 mm;
- longitud 18,5 mm;
- altura 3,15 mm;
- precisión nominal ±20 s/mes;
- duración nominal de pila de 3 años;
- tres agujas y detección de choque.

### MIYOTA 8215

- página oficial;
- specification;
- drawing;
- instruction manual;
- parts list and exploded view.

Datos curados:

- 11 1/2 líneas;
- diámetro 26 mm;
- altura 5,67 mm;
- precisión nominal −20/+40 s/día;
- reserva aproximada de 42 h;
- 21.600 alternancias/hora;
- 21 rubíes;
- ángulo de alzado de 49°;
- automático, cuerda manual, fecha rápida, tres agujas/fecha y parada de segundero.

### Reglas del registro

- solo admite URLs HTTPS del dominio `miyotamovement.com`;
- cada dato oficial referencia una o más fuentes del mismo calibre;
- un calibre `curated` necesita el conjunto documental completo;
- un calibre `planned` no puede contener una curación parcial que parezca validada;
- las copias locales están declaradas como no almacenadas;
- no existe hash si no existe copia local;
- la prueba dorada protege el fingerprint de los datos curados.

No se descargó indiscriminadamente el catálogo ni se redistribuyeron PDFs oficiales.

---

## 4. Jerarquía de datos

`TechnicalDataLayer` mantiene ocho capas:

1. `official-nominal`;
2. `official-part-identity`;
3. `document-inferred-relation`;
4. `visual-reconstruction-estimate`;
5. `physical-unit-observation`;
6. `physical-unit-measurement`;
7. `educational-simulation`;
8. `unknown`.

Reglas de validación:

- un dato oficial necesita fuente;
- una coordenada normalizada no puede ser nominal oficial;
- un valor desconocido debe ser `null`;
- una medición necesita identificar la unidad física;
- una geometría normalizada nunca se declara oficial;
- una relación documental necesita fuente.

Las posiciones y tamaños internos de los fixtures R2 usan `normalized-educational` y `visual-reconstruction-estimate`. Las dimensiones de envolvente permanecen en el ledger como datos nominales oficiales independientes.

---

## 5. Ledger de reconstrucción

Cada `ReconstructionPartRecord` conserva:

- ID canónico y todas sus instancias;
- tipo de entidad: pieza oficial, conjunto oficial, placeholder de interfaz o componente conceptual;
- fabricante, calibre, familia y variante;
- referencia oficial;
- nombre ES, nombre EN y clasificación editorial de la traducción;
- subsistema;
- fuentes;
- disponibilidad de geometría oficial;
- dimensiones oficiales, medidas y estimadas;
- conteo de dientes cuando exista;
- interfaces y relaciones funcionales;
- primitivas geométricas;
- estado del modelo;
- nivel R0–R4;
- G/K/P y limitaciones;
- unidad física;
- revisión y fecha.

Estados implementados:

- `documented`;
- `envelope-only`;
- `structurally-modelled`;
- `visually-reconstructed`;
- `physically-measured`;
- `validated`;
- `blocked`;
- `unknown`.

Un componente documentado sin geometría detallada utiliza un marcador simbólico y conserva G0. Su identidad no eleva automáticamente su fidelidad geométrica.

---

## 6. Niveles R0–R4

| Nivel | Significado |
|---|---|
| R0 | identidad, fuente y metadatos |
| R1 | envolvente oficial e interfaces de caja/esfera/agujas/tija |
| R2 | piezas individualizadas, subsistemas, capas y relaciones estructurales |
| R3 | contornos y apariencia reconocibles, con estimaciones explícitas |
| R4 | corrección mediante fotografías y mediciones de una unidad física identificada |

Los fixtures 2035 y 8215 se declaran **R2**, no “gemelos exactos”. Los dos modelos conceptuales son también ensamblajes estructurales R2, pero su fidelidad geométrica es G1.

---

## 7. MIYOTA 2035

### Ensamblaje

`MIYOTA_2035_TECHNICAL_FIXTURE` contiene:

- 33 registros de ledger;
- 33 instancias canónicas;
- envolvente R1;
- estructura base explícitamente estimada;
- pila SR626SW;
- abrazadera y contacto;
- unidad de circuito;
- unidad de bobina;
- estator;
- rotor magnetizado;
- puente del tren;
- ruedas y piñones documentados;
- minutería;
- puesta en hora y tija;
- tornillos oficiales relevantes;
- interfaces de las tres agujas.

El resonador no se inventa como recambio independiente. Como no aparece separado en la lista oficial de servicio, `quartz-resonator` resuelve la unidad oficial del circuito y el ledger documenta esa limitación.

### Fidelidad

- reconstrucción: R2;
- G2/K2/P0;
- las identidades y referencias de piezas proceden de documentación oficial;
- la envolvente y los datos generales oficiales viven como datos nominales;
- la geometría interna es normalizada y estimada;
- no hay medidas R4 ni física eléctrica validada.

### Operaciones

La identidad canónica permite selección individual, agrupación por subsistema, aislamiento, ocultación, transparencia, resaltado, explosionado normalizado y restauración. El renderer de producción para esas primitivas v6 sigue pendiente.

---

## 8. MIYOTA 8215

### Ensamblaje único

`MIYOTA_8215_TECHNICAL_FIXTURE` contiene:

- 56 registros de ledger;
- 63 instancias canónicas, incluyendo cantidades de tornillos y muelles;
- envolvente R1;
- estructura base estimada;
- puentes;
- barrilete completo;
- tren;
- escape;
- áncora;
- volante con espiral como conjunto oficial;
- cuerda manual y puesta en hora;
- minutería;
- calendario;
- automático;
- masa oscilante;
- tornillos e interfaces de agujas.

Automático, calendario y rotor forman parte de un único `CanonicalAssembly`. Ocultar un subsistema solo modifica el overlay; no crea variantes divergentes.

### Piezas compuestas y rubíes

- `Barrel complete` conserva los roles `barrel` y `mainspring`, pero no finge dos recambios oficiales.
- `Balance with hairspring regulated` conserva los roles `balance` y `hairspring`, pero sigue siendo un conjunto oficial.
- el recuento nominal de 21 rubíes se conserva como dato oficial del calibre;
- no se inventan 21 piezas de rubí individuales;
- solo se individualizan los conjuntos enjoyados identificables en la lista oficial.

### Fidelidad

- reconstrucción: R2;
- G2/K2/P0;
- cinemática funcional, sin tolerancias internas ni conteos de dientes validados;
- sin lubricación, desgaste, choque o diagnóstico físico presentados como ingeniería.

### Errores visuales controlados

El fixture declara tres escenarios simbólicos y reversibles: volante bloqueado, puente de rueda de centro desalineado y orden incorrecto de retirada del rotor. Todos usan la capa `educational-simulation`, llevan `engineeringValidated: false` y no se presentan como física ni diagnóstico real.

El 2035 declara de la misma forma bobina ausente/oculta y rotor paso a paso bloqueado. El overlay puede activar y restaurar estos IDs sin mutar el ensamblaje.

---

## 9. Modelos conceptuales

### Cadena conceptual de cuarzo

`CONCEPTUAL_QUARTZ_FIXTURE` contiene:

- fuente;
- control electrónico;
- referencia temporal de cuarzo;
- bobina;
- rotor paso a paso;
- tren;
- puesta en hora;
- minutería;
- indicación.

No está etiquetado como ISA 8172 ni MIYOTA 2035.

### Movimiento mecánico conceptual

`CONCEPTUAL_MECHANICAL_FIXTURE` contiene:

- muelle real;
- barrilete;
- tren;
- rueda de escape;
- áncora;
- volante;
- espiral;
- puesta en hora;
- minutería;
- indicación.

Se declara G1/K2/P0 y no está etiquetado como 8215.

---

## 10. Selectores semánticos

Los contratos se resuelven con `SemanticSelectorResolver` sobre `ProjectEntityIndex`.

### Cuarzo

- `power-source`;
- `electronic-control`;
- `quartz-resonator`;
- `coil`;
- `stepper-rotor`;
- `train`;
- `keyless`;
- `motion-works`;
- `indication`.

### Mecánico

- `mainspring`;
- `barrel`;
- `train`;
- `escape-wheel`;
- `pallet-fork`;
- `balance`;
- `hairspring`;
- `keyless`;
- `motion-works`;
- `automatic-winding`;
- `calendar`;
- `indication`.

También existen selectores por:

- instancia;
- definición;
- rol;
- subsistema;
- familia;
- calibre;
- variante;
- interfaz;
- etiqueta;
- tipo de pieza;
- consulta compuesta.

Cada contrato declara cardinalidad y el fixture coordinado comprueba todas las resoluciones. Los IDs de selector son únicos dentro de cada fixture.

---

## 11. Relaciones funcionales

Los tipos disponibles y cubiertos por fixtures son:

- `part-of`;
- `supports`;
- `pivots-in`;
- `meshes-with`;
- `drives`;
- `locks`;
- `releases`;
- `impulses`;
- `winds`;
- `sets`;
- `retains`;
- `covers`;
- `fastened-by`;
- `remove-before`;
- `inspect-before`.

Cada relación conserva capa, fuentes, confianza, reversibilidad y limitaciones.

`TechnicalRelationshipIndex` permite consultar:

- relaciones entrantes y salientes;
- un tipo concreto;
- un subsistema;
- confianza mínima;
- dependencias `remove-before`;
- comprobaciones `inspect-before`.

Las relaciones funcionales educativas se etiquetan como simulación. No se transforman en tolerancias, física o instrucciones de servicio validadas.

---

## 12. Fixture del primer módulo

`FIRST_MODULE_TECHNICAL_FIXTURE` referencia:

1. cuarzo conceptual;
2. MIYOTA 2035;
3. mecánico conceptual;
4. MIYOTA 8215.

No contiene lecciones ni explicación pedagógica. Es un contrato técnico que enlaza fixtures, selectores, operaciones, reduced motion y requisitos del viewport.

`compileFirstModuleTechnicalFixture()`:

- valida las cuatro referencias;
- resuelve cada selector;
- comprueba cardinalidad;
- devuelve bloqueos del viewport por separado;
- compila correctamente aunque no finja que las carencias visuales ya existen.

### Reduced motion

- estados discretos;
- flechas estáticas numeradas como requisito futuro;
- sin movimiento automático de cámara;
- scrub por pasos.

---

## 13. Operaciones visuales

### Disponibles en contrato técnico reversible

- selección;
- visibilidad;
- aislamiento;
- transparencia;
- resaltado;
- explosionado normalizado;
- captura de estado;
- restauración idempotente.

### Disponibles en el runtime existente

- timeline absoluto;
- pausa;
- scrub;
- reduced motion;
- restauración de overlay.

### Limitadas o pendientes en producción

| Capacidad | Estado | Motivo |
|---|---|---|
| render de selección v6 | limitado | StudioViewport sigue vinculado a geometría v5 |
| visibilidad/aislamiento v6 | limitado | falta renderer de primitivas técnicas |
| transparencia por submesh | limitada | la granularidad material actual es parcial |
| etiquetas | limitada | no tienen anclaje espacial por instancia |
| flechas | no disponible | faltan anclajes geométricos |
| ejes y sentidos de rotación | no disponible | no existen todavía ejes por instancia |
| ruta energética dibujada | no disponible | existe como grafo consultable, no como overlay espacial |
| cuatro fixtures simultáneos | no disponible | falta composición multi-viewport |
| trayectorias por pieza | no disponible | hay orden estructural, no rutas físicas validadas |

Estas carencias se declaran en el fixture y en el informe visual.

---

## 14. Informe visual

Comando:

```powershell
npm run learning:fixture-report
```

Salidas:

- `learning-content/horology-foundations/generated/fixture-visual-report.json`
- `learning-content/horology-foundations/generated/fixture-visual-report.md`

El informe muestra por fixture:

- recurso;
- ID y versión;
- selectores y cardinalidad;
- piezas disponibles;
- roles ausentes;
- nivel R;
- fuentes;
- número de datos oficiales, estimados y medidos;
- G/K/P;
- capacidades del viewport;
- bloqueos;
- limitaciones.

El informe es técnico y regenerable. No es contenido publicable ni un paquete de curso.

---

## 15. Pruebas

`src/learning/technical/system4b.test.ts` cubre:

- esquema y dominio de las fuentes oficiales;
- conjunto documental 2035/8215;
- contrato futuro sin curación parcial;
- fingerprint dorado de datos oficiales;
- procedencia por pieza;
- separación entre oficial, estimado y medido;
- prohibición de dimensiones oficiales normalizadas;
- cuatro fixtures y modelos conceptuales separados;
- G1/K2/P0 conceptual;
- ensamblaje canónico único;
- selectores, unicidad y cardinalidad;
- quince relaciones funcionales y consultas;
- estado visual reversible;
- restauración idempotente;
- serialización sin pérdida;
- ausencia de mutación de `WatchProject`;
- reduced motion;
- compilación del fixture coordinado;
- informe visual y bloqueos explícitos.

La suite general también conserva la compatibilidad existente con proyectos v5, `.wplab`, persistencia y catálogo multimarca.

---

## 16. Archivos principales

| Archivo | Responsabilidad |
|---|---|
| `src/learning/technical/officialSources.ts` | registro oficial y prueba dorada |
| `src/learning/technical/reconstruction.ts` | contratos R0–R4, ledger, datos, geometría, relaciones y fixture |
| `src/learning/technical/fixtures.ts` | cuatro ensamblajes y fixture coordinado |
| `src/learning/technical/relationships.ts` | consultas del grafo funcional |
| `src/learning/technical/fixtureBridge.ts` | estado visual reversible por instancia |
| `src/learning/technical/visualReport.ts` | modelo y render Markdown del informe |
| `scripts/learning-fixtures.ts` | generación del informe |
| `src/learning/technical/system4b.test.ts` | pruebas de Sistema 4B |

---

## 17. Deuda explícita

### Datos y reconstrucción

- validar físicamente posiciones, órdenes y geometría interna;
- fotografiar y medir unidades concretas para llegar a R4;
- reconstruir contornos R3;
- obtener conteos de dientes documentados o medidos;
- mapear rubíes individuales del 8215 solo con evidencia suficiente;
- validar el orden completo de desmontaje/montaje sobre una unidad.

### Viewport

- renderer v6 de primitivas y mallas por instancia;
- composición coordinada de cuatro fixtures;
- anclajes de etiquetas y flechas;
- sentidos de giro;
- visualización del grafo energético;
- trayectorias de explosionado/desmontaje por pieza;
- opacidad material independiente;
- cámara ortográfica explícita.

### Fuera de alcance

- redactar el curso;
- convertir el blueprint en lecciones, preguntas o rúbricas;
- decidir el currículo;
- modelar 82S0, 8N24 o serie 90;
- implementar tutor, OCR, visor PDF, diagnóstico físico completo o física de lubricación/desgaste/choque.

---

## 18. Criterios de aceptación

| Criterio | Resultado |
|---|---|
| registro oficial curado 2035/8215 | cumplido |
| procedencia por dato | cumplido |
| modelos conceptuales separados | cumplido |
| ensamblaje estructural 2035 | cumplido en R2 |
| ensamblaje estructural 8215 | cumplido en R2 |
| selectores estables | cumplido |
| relaciones consultables | cumplido |
| vistas reversibles | cumplido en el bridge técnico |
| fixture coordinado compila | cumplido |
| carencias visuales explícitas | cumplido |
| ausencia de dimensiones inventadas | comprobado |
| `npm run verify` | cumplido: 56 archivos, 227 pruebas, lint y build |

Sistema 4B no afirma haber alcanzado R3, R4 ni un gemelo exacto.

Verificación CAD adicional: `npm run cad:test`, **8 pruebas superadas**.
