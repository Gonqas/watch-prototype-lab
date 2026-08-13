# Academia · Sistemas 3, 4 y 5

Fecha de cierre: 2026-08-02  
Paquete: `wplab.horology.advanced-architecture-service@1.0.0`  
Estado editorial: `approved`  
Distribución: local, sin conexión, sin activos externos embebidos

## Resultado

Los Sistemas 3, 4 y 5 se han implementado como una sola progresión:

1. **Atlas comparativo**: enseña a identificar y comparar arquitecturas conservando autoridad, procedencia y desconocidos.
2. **Método de servicio**: transforma esa lectura en planes de intervención con herramientas, riesgos, dependencias, inspección, aceptación y evidencia.
3. **Arquitecturas y complicaciones**: aplica ambos sistemas a decisiones sobre segundos, automáticos, construcción extraplana, calendarios, escapes y cronógrafos.

No son tres catálogos aislados. Los casos del Atlas alimentan los estudios de servicio y los trade studies de arquitectura; las actividades usan el mismo contrato `theory-first`, conservan evidencia local y exigen revisión humana cuando la competencia afecta al mundo físico.

## Contenido instalado

El paquete contiene:

- 3 rutas;
- 15 módulos;
- 15 lecciones;
- 15 actividades;
- 15 conceptos;
- 15 competencias;
- 15 escenas;
- 15 bloques teóricos;
- 9.845 palabras de teoría previa;
- 30 plantillas de evidencia: respuesta razonada y revisión humana separadas;
- 13 fuentes curadas;
- 14 familias arquitectónicas;
- 11 casos comparativos;
- 5 procedimientos de servicio.

La generación es reproducible mediante:

```powershell
npm run learning:advanced-generate
npm run learning:validate -- learning-content/advanced-watchmaking
npm run learning:lint -- learning-content/advanced-watchmaking
```

El contenido editable y el `dist/pack.json` se encuentran en `learning-content/advanced-watchmaking/`.

## Sistema 3 · Atlas comparativo

### Modelo de datos

`src/learning/atlas/comparativeAtlas.ts` define:

- fuentes comparativas con autoridad, alcance y fecha de consulta;
- familias arquitectónicas por dominio;
- relaciones que distinguen cada familia;
- compromisos funcionales;
- casos de calibre o patrones de referencia;
- hechos oficiales;
- observaciones secundarias;
- desconocidos;
- disponibilidad real del modelo;
- alcance de la geometría;
- uso pedagógico.

La invariante principal es:

> Un caso sin modelo instalado no puede declarar geometría. Un caso documental no se convierte en gemelo visual por aparecer en el Atlas.

### Familias cubiertas

- pequeño segundero;
- segundero central directo;
- segundero central indirecto;
- automático con inversores;
- automático por palanca de uñas;
- automático unidireccional;
- puentes separados;
- arquitectura extraplana;
- escape de áncora suizo;
- fecha simple;
- cronógrafo gobernado por levas;
- cronógrafo con rueda de pilares;
- acoplamiento horizontal;
- embrague vertical.

### Casos cubiertos

- ETA 6497-2;
- ETA 2824-2;
- ETA 7750;
- Seiko familia 42;
- Seiko 6138A;
- MIYOTA 8215;
- MIYOTA 2035 como contraste funcional de cuarzo;
- patrón de segundero central indirecto;
- patrón de arquitectura extraplana;
- caso de archivo de servicio;
- caso histórico de identidad de reloj de bolsillo.

Solo MIYOTA 2035 y 8215 declaran ensamblaje estructural instalado. El modelo mecánico conceptual se usa únicamente cuando la actividad declara representación conceptual. Los ETA y Seiko permanecen como casos documentales.

### Nueva superficie

El Atlas abre por defecto la vista **Arquitecturas y calibres**. Permite:

- filtrar por dominio;
- navegar familias;
- ver casos vinculados;
- distinguir caso documental, conceptual o estructural;
- consultar hechos oficiales, observaciones secundarias y desconocidos;
- abrir las fuentes originales;
- saltar a estudios relacionados.

La vista anterior de modelos, piezas, relaciones y procedencia sigue disponible en **Modelos y piezas**.

## Sistema 4 · Procedimientos y servicio

### Contrato de dominio

`src/learning/service/serviceProcedures.ts` separa:

- capacidad de herramienta;
- riesgo y control;
- condición de parada;
- paso y condición de entrada;
- acción permitida;
- acción prohibida;
- observación esperada;
- punto de inspección;
- criterio de aceptación;
- requisito de evidencia;
- reversibilidad digital;
- reversibilidad física no garantizada;
- revisión humana.

### Capacidades de herramienta

1. Documentar sin alterar.
2. Sujetar sin deformar.
3. Accionar tornillos con ajuste.
4. Manipular piezas delicadas.
5. Inspeccionar con aumento e iluminación.
6. Medir con trazabilidad.
7. Planificar limpieza compatible.
8. Planificar lubricación documentada.

El contrato describe capacidad y criterio de selección, no una marca comercial obligatoria.

### Riesgos

- energía almacenada;
- expulsión o pérdida de piezas;
- daño de pivote o rubí;
- mezcla de piezas o pérdida de identidad;
- incompatibilidad química o material;
- aceptación sin evidencia suficiente.

Cada riesgo tiene severidad, probabilidad, desencadenantes, controles y condiciones de parada.

### Procedimientos

1. **Identificar, documentar y decidir autoridad**: estado inicial, alcance y energía.
2. **Desmontaje guiado por dependencias**: grafo `remove-before`, liberación y trazabilidad de piezas.
3. **Plan de limpieza y lubricación**: material–proceso y punto–producto–cantidad–fuente.
4. **Montaje, verificación y aceptación**: apoyo, libertad incremental y matriz funcional final.
5. **Diagnóstico causal e informe**: síntoma, hipótesis, prueba discriminante e informe con deuda.

### Frontera física

La Academia no marca una intervención física como completada. La respuesta digital produce evidencia de planificación y razonamiento. El dominio físico requiere una segunda evidencia `human-review`, generada por el evento independiente `advanced-human-review-completed`.

La restauración de una sesión solo restaura estado digital. Nunca promete recuperar una pieza deformada, un pivote roto, un muelle liberado o una superficie contaminada.

### Limpieza y lubricación

No existe una receta genérica. La ruta obliga a documentar:

- material y componente;
- contaminante;
- proceso compatible;
- exclusiones;
- verificación posterior;
- punto de lubricación;
- producto;
- cantidad;
- método;
- fuente aplicable al calibre y revisión.

Un dato ausente queda bloqueado. No se copia de otro movimiento por similitud.

## Sistema 5 · Arquitecturas y complicaciones

### Itinerario

1. Escapes: función común y geometrías no transferibles.
2. Arquitectura extraplana y presupuesto axial.
3. Calendarios como acumulación, salto, retención y corrección.
4. Control de cronógrafo: levas y rueda de pilares.
5. Acoplamiento horizontal y embrague vertical.
6. Proyecto final: defender una arquitectura completa.

### Método

Cada estudio exige:

- pregunta de diseño;
- modelo causal;
- al menos dos casos;
- relaciones distintivas;
- compromisos;
- ejemplo razonado;
- errores frecuentes;
- afirmaciones confirmadas;
- inferencias refutables;
- desconocidos;
- plan de validación.

El proyecto final convierte un deseo en requisitos verificables y compara alternativas mediante umbrales y evidencias. Un incumplimiento obligatorio no puede quedar oculto por una suma de puntuaciones.

## Teoría antes de la práctica

Todas las lecciones tienen `LessonStudyContract` con:

- secuencia `theory-first`;
- lectura mínima calculada desde el bloque real;
- orientación, preentrenamiento, explicación, ejemplo, práctica y cierre;
- fuentes obligatorias;
- tres criterios de preparación;
- nota previa;
- desbloqueo de actividad después de la lectura requerida.

La actividad no introduce y evalúa el mismo concepto. El contenido teórico se estudia antes; la actividad practica o transfiere.

## Evaluación y persistencia

Cada actividad conserva dos carriles:

1. **Respuesta estructurada**: hechos y fuentes, razonamiento, desconocidos, confianza y condición que cambiaría la decisión.
2. **Revisión humana**: criterios, resultado, evaluador y notas.

La respuesta queda almacenada aunque esté pendiente. No acredita dominio por longitud ni por mera finalización. La rúbrica de demostración exige evidencia `human-review` activa con confianza suficiente.

Los quince laboratorios definidos en `src/learning/architecture/architectureLabs.ts` prohíben explícitamente `physicalClaimAllowed` y requieren revisión humana.

## Experiencia de usuario

### Ficha de actividad

La ficha muestra, antes del preflight:

- casos y ejes de comparación;
- tipo de representación;
- frontera de autoridad;
- modo de procedimiento;
- cantidad de pasos, riesgos, inspecciones y criterios;
- advertencia sobre evidencia física.

### Workspace

Las actividades del Sistema 3 y 5 usan una **mesa documental**. Las del Sistema 4 usan un **planificador de procedimiento**. No cargan un modelo 3D ornamental cuando el objetivo y la evidencia son documentales.

La mesa documental muestra:

- calibre o patrón;
- autoridad;
- modelo disponible;
- alcance geométrico;
- fuentes;
- datos;
- desconocidos;
- ejes de comparación.

El planificador muestra:

- secuencia numerada;
- acciones;
- riesgos;
- herramientas;
- inspecciones;
- condiciones de entrada;
- prohibiciones;
- criterios de aceptación;
- frontera física.

El armazón del workspace también cambia según la naturaleza de la práctica. En una comparación aparecen `Casos`, `Mesa comparativa`, `Registrar estado` y una guía para separar hechos, inferencias y desconocidos. En servicio aparecen `Procedimiento`, los controles de riesgo y la guía de aceptación. En ambos se ocultan las piezas, el transporte, la velocidad y los controles de movimiento porque no existe una animación que gobernar. Las fichas, la recuperación y el historial hablan de `Dossier comparativo` o `Espacio de procedimiento`, no de un modelo 3D ficticio.

Los términos internos de dominios, relaciones, autoridad, representación y modos se traducen a lenguaje de estudio. Los identificadores técnicos solo permanecen disponibles en los apartados de diagnóstico.

### Taller

El Taller incorpora el filtro **Método de servicio**. El selector se adapta a la cantidad de herramientas sin columnas fijas que causen desbordamiento.

## Fuentes oficiales y secundarias

Fuentes primarias integradas:

- ETA 6497-2, página y comunicación técnica;
- ETA 2824-2, página de producto;
- ETA 7750, página y comunicación técnica;
- Seiko familia 42, guía técnica;
- Seiko 6138A, guía técnica;
- MIYOTA 8215 y 2035, documentación oficial ya curada.

Fuentes secundarias integradas:

- Ranfft;
- 17jewels;
- The Watch Guy;
- Pocket Watch Database.

Las fuentes secundarias sirven para descubrimiento, contraste, contexto y casos de observación. No adquieren autoridad oficial por estar integradas.

## Contratos de autoría nuevos

### `ComparativeArchitectureActivityContract`

Declara casos, ejes, representación, frontera de evidencia, necesidad de geometría, separación hecho–inferencia–desconocido y prohibición de dimensiones no respaldadas.

Una validación impide exigir geometría exacta cuando la representación no es un fixture existente.

### `ServiceProcedureActivityContract`

Declara procedimiento, modo, pasos, capacidades de herramienta, riesgos, inspecciones, aceptación, evidencia, restauración y frontera física.

`physicalCompletionClaim` es siempre `false` y `humanReviewForPhysicalCompetence` siempre `true`. Una actividad de observación física no puede prometer restauración digital como reversibilidad material.

## Pruebas

Se han añadido pruebas para:

- cardinalidad de familias, casos y fuentes;
- ausencia de geometría fingida;
- cobertura de casos por familia;
- resolución de herramientas, riesgos, inspecciones, evidencias y aceptación;
- frontera entre reversibilidad digital y física;
- referencias de los quince laboratorios;
- prohibición de acreditación física automática;
- integración del sexto paquete real;
- recuentos de 8 rutas, 67 módulos, 86 conceptos y 139 actividades;
- validación editorial de todo el contenido instalado.

## Limitaciones y deuda explícita

- No se han creado modelos 3D del ETA 6497-2, 2824-2, 7750 ni Seiko 42/6138A.
- No se han descargado ni copiado indiscriminadamente documentos o catálogos completos.
- No existe simulación física validada de embragues, escape, lubricación, desgaste, choque o marcha.
- El patrón extraplano es un marco de trade study, no un calibre.
- Las arquitecturas de escape distintas al áncora suizo se introducen como familias a ampliar; no tienen fixture propio.
- La revisión humana está contratada en datos y evaluación, pero no se ha implementado en este sistema un portal remoto de profesor.
- La documentación enlazada requiere conexión; todo el contenido original, los metadatos, las actividades y el progreso funcionan offline.

Estas limitaciones no se ocultan con sustitutos visuales. Cada una aparece como dato desconocido, capacidad ausente o frontera de autoridad.
