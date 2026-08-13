# Aprender — informe de decisiones de diseño

**Estado:** revisión integrada para aprobación; no inicia el Sistema 0 ni la implementación.  
**Fecha:** 22 de julio de 2026.  
**Documentos consolidados:** `APRENDER-VISION.md`, `APRENDER-ARQUITECTURA.md`, `APRENDER-MODELO-DATOS.md`, `APRENDER-UX.md`, `APRENDER-CONTENIDO.md` y `APRENDER-IMPLEMENTACION.md`.

## 1. Propósito y criterio de decisión

Este informe cierra con una recomendación las 18 decisiones abiertas de la fase de diseño. Conserva sus identificadores D01–D18 para mantener trazabilidad con el plan de implementación, pero las presenta en **orden de dependencia**, no en orden numérico.

Las recomendaciones se han evaluado con cinco criterios comunes:

1. no crear un segundo modelo físico paralelo al proyecto técnico;
2. distinguir siempre hechos, inferencias, simulaciones educativas y validaciones de ingeniería;
3. permitir trabajo local y sin conexión sin convertir la sincronización en requisito;
4. preservar los proyectos y paquetes existentes mediante cambios aditivos y migraciones reversibles;
5. poder ampliar movimientos, idiomas, autores y proveedores sin rehacer el núcleo.

### Clasificación temporal

- **B0 — bloqueante antes de programar:** debe aprobarse antes del primer cambio de código de Aprender.
- **Fase — necesaria durante una fase concreta:** puede programarse el núcleo previo, pero debe estar cerrada antes de la fase indicada.
- **Aplazable:** puede posponerse sin deuda estructural importante porque existe una interfaz o valor por defecto seguro.

Las siete decisiones B0 revisadas son **D01, D03, D04, D02, D07, D08 y D13**. D06 deja de bloquear el inicio porque el producto es privado, local y personal; conserva una fecha límite antes de persistir la biblioteca. El resto no autoriza a improvisar: tiene una fecha límite de diseño asociada a su fase.

## 2. Configuración integrada recomendada

La configuración de conjunto propuesta es la siguiente:

- El área visible se llama **Aprender**; el nombre editorial en inglés es **Watchmaking Academy** y el espacio técnico interno es `learning`.
- El contenido, los fixtures y los activos iniciales se organizan alrededor de **MIYOTA**: 2035 para cuarzo, 8215 para estudio mecánico profundo, 82S0/8N24 para observación abierta y 9015/9039 para comparación con la serie 90. 9100/9120 y otras variantes amplían complicaciones. El canon y el DSL permanecen multimarca.
- Se aprueba un **contrato canónico v6 aditivo y de propósito general**, no exclusivo de educación, capaz de representar instancias arbitrarias, puentes, tornillos, rubíes, interfaces y dependencias de montaje. El número persistido solo cambia a 6 cuando se guarde el primer dato que v5 no puede expresar.
- Geometría, cinemática y física usan **ejes de fidelidad separados**. Ningún resultado educativo se presenta como validación de ingeniería ni entra en un informe técnico sin una promoción explícita y trazable.
- El contenido se distribuye como paquetes declarativos, versionados, sin código ejecutable y con activos identificados por hash. Los paquetes integrados se marcan como tales y los personales pueden ser locales/no firmados sin modo desarrollador. La evaluación es determinista, basada en evidencias y versionada; el tutor contextual inicial también es determinista.
- El aprendizaje es **local-first**: perfil local por defecto, SQLite en escritorio, IndexedDB para la parte web compatible y funcionamiento sin conexión. No hay cuenta obligatoria ni sincronización en la primera versión.
- Proyectos técnicos y sesiones educativas permanecen separados: la sesión es una superposición reversible y solo una acción explícita y revisada puede proponer cambios al proyecto.
- `.wplab` conserva compatibilidad mediante entradas opcionales y aditivas; perfiles, progreso global y conversaciones del tutor no se embeben por defecto.
- La biblioteca admite documentos privados, OCR, traducciones y anotaciones locales. Original, OCR, traducción y explicación son capas distintas; los activos privados quedan excluidos de paquetes y proyectos exportados salvo inclusión expresa compatible con su clasificación de uso.

Esta configuración evita tres arquitecturas paralelas especialmente costosas: un modelo de reloj educativo distinto del técnico, una plataforma web con semántica distinta del escritorio y una evaluación opaca dependiente de IA.

### 2.1 Jerarquía de fuentes aprobada en esta revisión

La autoridad se resuelve por el tipo de afirmación, no por una puntuación genérica:

1. **Documentación oficial MIYOTA:** autoridad para especificaciones nominales, dimensiones declaradas, funciones, referencias de piezas, planos, listas, vistas explosionadas, frecuencia, rubíes, reserva de marcha y variantes oficiales.
2. **Observaciones y mediciones propias:** autoridad para el estado y dimensiones de la unidad física observada, fotografías, desgaste, modificaciones y diferencias frente al nominal.
3. **Libro privado de horología:** autoridad de apoyo para teoría, fabricación, herramientas, principios mecánicos, trenes, escapes, regulación, diagnóstico, alta relojería y complicaciones.
4. **Contenido educativo derivado:** traducciones privadas, explicaciones, diagramas, escenas, ejercicios, glosario e interpretaciones; siempre enlazado a la fuente o evidencia que transforma.

Un dato específico de un calibre MIYOTA no se infiere solo del libro cuando existe documentación oficial aplicable. El libro no se presenta como manual de servicio exacto de un MIYOTA salvo que trate explícitamente ese calibre. Una medición propia discrepante no sustituye el nominal: ambos claims se conservan con ámbitos distintos.

## 3. Decisiones en orden de dependencia

### 1. D01 — Nombre definitivo y posicionamiento del área

**Por qué es necesaria.** El nombre aparece en navegación, rutas, textos, telemetría local, paquetes de contenido, documentación y vocabulario de dominio. Cambiarlo tarde produce migraciones de identificadores o una mezcla visible de nombres.

**Partes de la arquitectura afectadas.** Navegación principal, shell de aplicación, rutas, nomenclatura de paquetes, localización, analítica futura y documentación pública.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| `Academy` en todos los idiomas | Breve y reconocible internacionalmente | Anglicismo en la interfaz española; describe una institución más que una acción |
| `Watchmaking Academy` como nombre único | Posicionamiento editorial claro | Largo para navegación; difícil de localizar; mezcla marca y área funcional |
| **`Aprender` visible + `Watchmaking Academy` editorial + `learning` interno** | Natural en español, localizable y estable en código; separa etiqueta de producto e identificador técnico | Exige documentar tres usos para evitar sustituciones informales |
| `Formación` o `Aula` | Descriptivo | Suena administrativo o limitado a cursos formales |

**Recomendación concreta.** Usar **Aprender** en navegación española, **Learn** en navegación inglesa, **Watchmaking Academy** como denominación editorial inglesa y `learning` para rutas, tipos y almacenamiento. Los identificadores no deben derivarse del texto traducido.

**Consecuencias.** La marca puede evolucionar sin migrar datos; las rutas y esquemas quedan estables; toda cadena visible deberá pasar por localización.

**Si se aplaza.** Se filtran nombres provisionales a rutas, tablas y paquetes, y renombrar deja de ser un cambio puramente editorial.

**Clasificación.** **B0 — bloqueante antes de programar.**

**Archivos o modelos afectados.** `src/vnext/Sidebar.tsx`, `src/App.tsx`, futuros `src/learning/*`, claves i18n, `LearningPackageManifest`, documentación y nombres de tablas `learning_*`.

---

### 2. D03 — Necesidad y alcance del esquema canónico v6

**Por qué es necesaria.** El modelo v5 contiene un conjunto cerrado de `WatchPartId` y cinco árboles mecánicos fijos. No puede identificar de manera persistente dos tornillos iguales, varios puentes, rubíes, piezas opcionales, orientación, interfaces de ensamblaje o un orden de servicio. Es insuficiente para enseñar montaje real y también limita importación CAD, BOM y mantenimiento técnico.

**Partes de la arquitectura afectadas.** Modelo canónico, motor geométrico, catálogo, CAD sidecar, persistencia, migraciones, `.wplab`, inspección, BOM, secuencias de servicio y compatibilidad.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Mantener v5 y codificar excepciones por lección | Inicio rápido | Deuda inmediata; identidades inestables; segundo modelo físico educativo |
| Crear un modelo de montaje solo para Aprender | Aísla el riesgo inicial | Duplica piezas, dimensiones y procedencia; divergirá del proyecto técnico |
| **Definir v6 general, aditivo y con adaptador v5** | Resuelve educación y necesidades técnicas; una sola fuente de verdad; migración gradual | Requiere diseño de contrato antes de UI; aumenta el alcance inicial del dominio |
| Sustituir v5 de una vez | Modelo limpio desde el primer día | Migración de alto riesgo y ruptura innecesaria de API y archivos existentes |

**Recomendación concreta.** Aprobar ahora el contrato lógico v6, pero desplegarlo de forma progresiva. Debe añadir:

- `PartDefinition` y `PartInstanceId` estable;
- `AssemblyInterface` tipada entre instancias;
- `AssemblyDependency` con requisito, orden parcial y motivo;
- instancias explícitas de puente, tornillo, rubí, pasador, muelle y conjunto;
- pose, rol semántico, etiquetas de servicio y referencia opcional a geometría;
- procedencia en las dimensiones y propiedades, sin copiarlas a la capa educativa;
- un adaptador que proyecte proyectos v5 como entidades v6 sintéticas y estables.

El `schemaVersion` persistido permanece en 5 mientras el proyecto sea expresable íntegramente en v5. Sube a 6 solo al guardar una instancia o relación nueva, con migración de ida, lectura retrocompatible y pruebas doradas.

**Consecuencias.** `ProjectEntityIndex` puede ser una proyección del proyecto, no otro inventario. Las lecciones referencian selectores semánticos y luego resuelven instancias. BOM, desmontaje y CAD comparten identidad. Habrá que especificar cardinalidad, estabilidad de IDs y reglas de borrado.

**Si se aplaza.** El primer desmontaje obligará a introducir IDs locales en contenido o estado de UI; después será difícil reconciliarlos con el modelo técnico sin romper evidencias y progreso.

**Clasificación.** **B0 — bloqueante antes de programar.** No obliga a implementar toda v6 antes del shell, pero sí a congelar su frontera y estrategia de migración.

**Archivos o modelos afectados.** `src/types.ts`, `src/vnext/model.ts`, `src/vnext/store.ts`, `src/vnext/geometry.ts`, `src/data/designMigration.ts`, `src/data/catalog.ts`, `src/logic/geometryKernel.ts`, `cad-engine/watchlab_cad/project.py`, `protocol.py`, `builders.py`; nuevos `PartDefinition`, `PartInstance`, `AssemblyInterface`, `AssemblyDependency`, `ProjectEntityIndex` y migraciones v5→v6.

---

### 3. D04 — Niveles de fidelidad y frontera entre educación e ingeniería

**Por qué es necesaria.** “Exacto”, “simulado” y “realista” no significan lo mismo para una forma, una relación cinemática o un comportamiento físico. Sin una taxonomía, una animación didáctica puede terminar citada como comprobación técnica.

**Partes de la arquitectura afectadas.** Evidencias, viewport, motor CAD, simuladores, informes, evaluación, tutor, badges de UI y reglas de promoción al proyecto.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Una escala única “baja/media/alta” | Fácil de explicar | Mezcla geometría, cinemática y física; induce conclusiones falsas |
| Etiquetas libres por actividad | Flexibilidad editorial | No comparables ni validables por máquina |
| **Tres ejes tipados G/K/P más procedencia y fiabilidad** | Precisión semántica; permite combinar una geometría exacta con física simplificada | Más metadatos y disciplina editorial |
| Usar solo el resultado del CAD | Autoridad técnica aparente | No cubre prácticas educativas, modelos analíticos ni incertidumbre experimental |

**Recomendación concreta.** Adoptar niveles independientes:

- **Geometría:** G0 sin geometría; G1 ilustrativa; G2 envolvente paramétrica; G3 B-rep exacta respecto a parámetros declarados; G4 correlacionada con medición o referencia controlada.
- **Cinemática:** K0 ninguna; K1 animación ilustrativa; K2 restricciones y relaciones deterministas; K3 contactos/eventos simulados; K4 validada experimentalmente.
- **Física:** P0 ninguna; P1 reglas cualitativas; P2 modelo analítico concentrado; P3 modelo numérico calibrado; P4 validación experimental.

Cada `EvidenceClaim` declara nivel, origen, método, exactitud, fiabilidad, huella de entradas y limitaciones. “Exacto” solo describe una operación exacta del kernel sobre geometría conocida, no la correspondencia automática con una pieza fabricada.

Separar además dos pipelines: `learning.simulation` produce explicaciones y predicciones didácticas; `engineering.validation` consume exclusivamente estado canónico y produce hallazgos técnicos. Una simulación educativa nunca modifica el proyecto ni satisface una regla de ingeniería. La promoción exige comando explícito, previsualización de diff, procedencia y deshacer.

**Consecuencias.** La UI deberá mostrar badges G/K/P y advertencias comprensibles. Contenido, evaluación y tutor pueden citar afirmaciones sin inflar su autoridad. Las pruebas deberán impedir cruces silenciosos entre pipelines.

**Si se aplaza.** Aparecerán promesas de fidelidad incompatibles, informes contaminados y actividades cuya validez no podrá reconstruirse después.

**Clasificación.** **B0 — bloqueante antes de programar.**

**Archivos o modelos afectados.** `src/core/engineering.ts`, `src/core/dynamics.ts`, `src/core/interactiveReport.ts`, `src/logic/validation.ts`, `src/logic/geometryKernel.ts`, `src/vnext/engine.ts`, `cad-engine/watchlab_cad/analysis.py`; nuevos `FidelityProfile`, `EvidenceClaim`, `EducationalSimulationResult`, `EngineeringValidationResult` y `ProjectChangeProposal`.

---

### 4. D02 — Movimiento o calibre educativo inicial

**Por qué es necesaria.** El calibre determina ontología, piezas mínimas, profundidad geométrica, bibliografía, licencias, secuencias de montaje, instrumental y coste editorial. Un “movimiento genérico” evita la decisión solo a costa de contenidos no verificables.

**Partes de la arquitectura afectadas.** Catálogo, modelo de entidades, currículo, biblioteca, activos 2D/3D, metrología, simulación y pruebas de aceptación.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| MIYOTA 2035 como único calibre inicial | Ya existe contexto en el repositorio; cuarzo simple y documentación oficial | No cubre el desmontaje mecánico profundo ni el tren/escape tradicionales |
| MIYOTA 8215 aislado | Calibre mecánico estándar con documentación, despiece, automático y calendario | Mayor complejidad inicial y no cubre fundamentos de cuarzo |
| Arquitectura y contenido exclusivamente MIYOTA | Máxima reutilización entre familias | Acopla el producto a una marca y dificulta importar otros movimientos |
| **Arquitectura multimarca y currículo inicial MIYOTA por familias** | Reutiliza documentación y parentesco entre variantes sin hipotecar el canon; crea una progresión cuarzo/estándar/premium/complicaciones | Exige representar capacidades parciales y ocultar subsistemas sin alterar el modelo canónico |
| Movimiento mecánico abstracto | Sin dependencia comercial | Nombres, tolerancias y orden de servicio ficticios; baja transferencia al taller |

**Recomendación concreta.** Adoptar una arquitectura multimarca y priorizar este ecosistema editorial:

1. **MIYOTA 2035:** fundamento de cuarzo, pila, circuito, bobina, motor paso a paso, tren, puesta en hora y diagnóstico básico. Su ficha oficial ofrece especificación, dibujo, instrucciones y lista/despiece: [MIYOTA 2035](https://miyotamovement.com/product/2035/).
2. **MIYOTA 8215:** calibre mecánico profundo principal: arquitectura, energía, barrilete, tren, escape, volante/espiral, cuerda, puesta en hora, calendario, automático, servicio, lubricación, regulación y diagnóstico. MIYOTA lo documenta como automático/manual, tres agujas con fecha, 21 rubíes y 21.600 A/h, con lista y vista explosionada: [MIYOTA 8215](https://miyotamovement.com/product/8215/).
3. **MIYOTA 82S0 y 8N24:** observación open-heart/esqueletizada y comparación dentro de la familia 82: [82S0](https://miyotamovement.com/product/82S0/) y [8N24](https://miyotamovement.com/product/8N24/).
4. **MIYOTA 9015 y 9039:** serie premium más fina y de 28.800 A/h para comparar tamaño, disposición y eficiencia con la serie 82: [9015](https://miyotamovement.com/product/9015/) y [9039](https://miyotamovement.com/product/9039/).
5. **MIYOTA 9100, 9120 y posteriores:** calendarios, reserva de marcha y complicaciones: [familia premium MIYOTA](https://miyotamovement.com/product/?ct9=1).

El 8215 se presenta progresivamente por subsistemas. Ocultar o desactivar rotor, automático o calendario es una vista de escena y una restricción de interacción; no elimina esas entidades del ensamblaje canónico ni crea un “8215 simplificado” incompatible.

**Consecuencias.** El contrato v6 debe soportar tornillería, puentes, rubíes, calendario, automático, variantes de familia y conjuntos activables por escena. Fixtures y activos iniciales se concentran en MIYOTA, pero `MovementReference`, selectores y capacidades no incorporan la marca como condición estructural. El contenido profundo exige una unidad física y observaciones propias cuando afirme estado o dimensiones reales.

**Si se aplaza.** Los esquemas y lecciones se diseñarán contra una abstracción y tendrán que reescribirse al descubrir piezas, cardinalidades y órdenes reales.

**Clasificación.** **B0 — bloqueante antes de programar.**

**Archivos o modelos afectados.** `src/data/catalog.ts`, `src/vnext/miyotaCatalog.ts`, `src/data/projectTemplates.ts`, `cad-engine/tests/fixtures/*`; futuros contenidos/fixtures `miyota-2035`, `miyota-8215`, `miyota-82s0`, `miyota-8n24`, `miyota-9015`, `miyota-9039`, `MovementReference`, `MovementFamily`, `SubsystemPresentation` y `ServiceProcedure`.

---

### 5. D06 — Fuentes privadas, procedencia y límites de exportación

**Por qué es necesaria.** Aunque el producto sea privado, local y personal, debe distinguir originales, copias locales, OCR, traducciones e interpretaciones para conservar rigor técnico y evitar que documentos privados viajen accidentalmente en proyectos o paquetes.

**Partes de la arquitectura afectadas.** Biblioteca, importación local, OCR, paquetes de contenido, caché offline, capas documentales, copias de seguridad y exportación.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Guardar solo enlaces | Modelo mínimo | Falla offline y no permite trabajar de forma integrada con el libro privado |
| Implantar desde el inicio un flujo jurídico/editorial público | Prepararía comercialización | Sobredimensionado para uso personal; bloquea trabajo local sin aportar valor actual |
| Copiar todo en paquetes y proyectos | Máxima portabilidad | Filtra originales privados, duplica activos y confunde uso local con compartible |
| **Procedencia obligatoria + clasificación simple de uso + exportación opt-in** | Permite PDF/OCR/traducción privados, conserva rigor y evita filtraciones por defecto | Una futura distribución pública necesitará una decisión y controles adicionales |

**Recomendación concreta.** Todo `TechnicalSource` conserva ID, título, tipo, autor/fuente cuando se conozca, URL o ruta administrada, fecha de consulta/importación, hash y clase de autoridad. Añadir un único campo `usage`:

- `private-local`;
- `official-linked`;
- `official-cached`;
- `user-created`;
- `shareable`;
- `unknown`.

Se permiten PDF y documentos locales, caché personal de documentos oficiales, OCR local, traducciones privadas, explicaciones y anotaciones. Original, OCR, traducción y explicación son capas inmutables/versionadas distintas, enlazables a página, figura o región. `private-local`, `official-cached` y `unknown` quedan excluidos por defecto de `.wplab` y paquetes exportados. No se construyen ahora territorio, marketplace, permisos editoriales complejos, firma obligatoria ni validación jurídica bloqueante. Si se plantea compartir o comercializar contenido, deberá aprobarse una política nueva antes de habilitar distribución.

**Consecuencias.** El libro privado puede usarse plenamente dentro de WPL sin incrustarse en el contenido portable. La procedencia se exige por calidad técnica y educativa. Backups locales pueden proteger los documentos privados, pero los exportadores deben filtrar por `usage` y mostrar una selección explícita si se solicita incluir un activo.

**Si se aplaza.** OCR, traducciones y originales tenderán a mezclarse o se incorporarán binarios privados a paquetes por accidente; la corrección exigiría separar capas y limpiar exports existentes.

**Clasificación.** **Fase — necesaria antes del Sistema 2 para persistir/importar fuentes y antes del Sistema 8 para la biblioteca completa. No es B0.** La infraestructura de distribución pública es aplazable sin deuda mientras los límites de exportación sean conservadores.

**Archivos o modelos afectados.** Futuros `TechnicalSource`, `SourceUsage`, `SourceLocator`, `SourceLayer`, `SourceAnnotation`, `AssetStore`, importador/OCR local, exportador `.wplab`, manifiestos y política de backups.

---

### 6. D17 — Nomenclatura bilingüe y glosario canónico

**Por qué es necesaria.** La terminología relojera varía por idioma, región y fabricante. Si los IDs se crean a partir de una etiqueta española o inglesa, las traducciones y referencias de lecciones se vuelven frágiles.

**Partes de la arquitectura afectadas.** Catálogo, selectores semánticos, búsqueda, contenido, tutor, evaluación, accesibilidad, importación de fuentes y localización.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Solo español al inicio | Menos trabajo editorial | IDs y textos se acoplan; migración posterior costosa; dificulta usar fuentes técnicas inglesas |
| Inglés como idioma canónico visible | Abundancia de documentación | Empeora la experiencia española y confunde término con identificador |
| **IDs neutros + términos ES/EN desde el primer esquema** | Estabilidad, búsqueda cruzada y crecimiento a más idiomas | Obliga a revisar el glosario inicial en dos lenguas |
| Traducción automática en tiempo de ejecución | Cobertura rápida | Terminología técnica inconsistente y no reproducible |

**Recomendación concreta.** Mantener IDs estables y no lingüísticos (`part.balance_staff`, por ejemplo) y un `TerminologyEntry` versionado con término preferido, sinónimos, términos desaconsejados, definición, contexto, fuente y equivalencias ES/EN. Español es el idioma de interfaz por defecto; inglés es el segundo idioma editorial obligatorio. En la primera aparición o mediante ayuda contextual se puede mostrar el equivalente del otro idioma. Ninguna traducción automática se publica sin revisión humana.

**Consecuencias.** Las lecciones sobreviven a correcciones terminológicas, la búsqueda encuentra sinónimos y el tutor puede explicar discrepancias entre manuales. Añadir francés o alemán no cambia los IDs.

**Si se aplaza.** Los IDs heredarán texto visible, las evidencias citarán nombres incompatibles y el coste de desambiguación crecerá con cada lección.

**Clasificación.** **Fase — necesaria antes de cerrar los esquemas del Sistema 2 y antes de escribir el contenido visible del Sistema 4.** No bloquea el primer contrato de infraestructura si se reserva desde ya una clave semántica neutra.

**Archivos o modelos afectados.** Futuros `TerminologyEntry`, `LocalizedText`, índices de búsqueda, selectores de `ProjectEntityIndex`, manifiestos de contenido, recursos i18n y guías editoriales.

---

### 7. D07 — Formato, versionado y gobierno del contenido declarativo

**Por qué es necesaria.** Un curso debe poder revisarse, importarse, validarse y reproducirse sin desplegar código. Además, una sesión histórica debe conservar la versión exacta de la actividad que evaluó al usuario.

**Partes de la arquitectura afectadas.** Paquetes, registro de actividades, renderers, evaluación, biblioteca, migraciones, integridad, importación/exportación y herramientas personales de autoría.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Componentes React/TypeScript por lección | Libertad visual total | Ejecuta código, impide autoría segura y acopla contenido a releases |
| Markdown con extensiones libres | Fácil de escribir | Insuficiente para estados, rubricas, selectores y validación fuerte |
| **Paquete ZIP declarativo local con JSON validado y Markdown restringido** | Portable, auditable, seguro y versionable; no necesita infraestructura editorial pública | Requiere catálogo de bloques y herramientas de validación |
| Base de datos central remota | Actualización inmediata | Rompe offline, dificulta reproducibilidad y crea dependencia de servicio |

**Recomendación concreta.** Definir `.wplab-learning-pack` como ZIP con:

- `manifest.json` con `formatVersion: 1`, ID, versión SemVer, idiomas, dependencias, procedencia, clasificación `integrated` o `local-unsigned` y hashes;
- objetos JSON para rutas, lecciones, actividades, rubricas, selectores, simulaciones y glosario;
- Markdown restringido para prosa, sin HTML o JavaScript arbitrario;
- JSON Schema publicado y validación equivalente en runtime (por ejemplo, Zod);
- activos por SHA-256 y referencias relativas seguras;
- firma opcional reservada para una futura distribución; los paquetes personales `local-unsigned` se cargan normalmente tras validación, sin modo desarrollador.

Cada objeto tiene ID estable y versión. Una sesión fija la versión exacta del paquete y de cada regla de evaluación. Autor, notas de revisión y estado editorial pueden registrarse, pero no se exige un flujo formal multiusuario de autor, relojero, pedagogo y publicador. Marketplace, firma obligatoria, distribución pública y políticas editoriales de equipo quedan fuera del alcance inicial.

**Consecuencias.** Contenido y aplicación evolucionan por separado, se puede validar localmente o en CI y el trabajo offline es natural. Los bloques nuevos requerirán una ampliación explícita del esquema y un renderer registrado. `integrated` expresa origen en la aplicación, no una certificación pública.

**Si se aplaza.** Las primeras lecciones quedarán incrustadas en UI, serán imposibles de migrar de forma fiable y abrirán una superficie de ejecución no controlada.

**Clasificación.** **B0 — bloqueante antes de programar.** Debe aprobarse el contrato, aunque la herramienta de autoría llegue después.

**Archivos o modelos afectados.** Nuevos `LearningPackageManifest`, `LearningPath`, `LessonDefinition`, `ActivityDefinition`, `BlockDefinition`, `ContentRegistry`, esquemas JSON, validadores, importador de paquetes y directorios de contenido.

---

### 8. D08 — Modelo de evaluación, dominio y evidencias

**Por qué es necesaria.** Completar una pantalla no demuestra una habilidad. La evaluación debe distinguir observar, explicar, medir, diagnosticar y ejecutar, y debe poder reconstruirse aunque cambien la lección o el algoritmo.

**Partes de la arquitectura afectadas.** Actividades, sesiones, evidencia, progreso, tutor, recomendaciones, UI de resultados, exportación de dossier y privacidad.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Puntos y porcentaje global | Familiar y simple | Oculta carencias, incentiva “hacer clic” y no explica la competencia |
| Solo finalización manual | Muy flexible | No comparable ni auditable; poco útil para recomendación |
| Evaluación generada por IA | Feedback rico | No determinista, difícil de auditar y dependiente de conexión/proveedor |
| **Rubricas deterministas basadas en evidencias, versionadas** | Reproducible, explicable, offline y compatible con revisión humana | Mayor trabajo de diseño de rubricas y normalización de evidencia |

**Recomendación concreta.** Evaluar competencias mediante `EvidenceRecord` inmutable y una `AssessmentRuleVersion` fijada a la sesión. Estados de dominio por competencia: `not_started`, `introduced`, `practising`, `demonstrated` y `retained`; `retained` exige evidencia posterior e independiente, no repetir inmediatamente el mismo ítem. Toda resolución debe explicar evidencia usada, regla, incertidumbre y siguiente práctica recomendada. No habrá puntuación total opaca ni rachas que sustituyan dominio. El tutor —incluida una futura IA— puede sugerir o redactar feedback, pero no conceder dominio por sí solo. Adaptaciones de accesibilidad no se contabilizan como ayudas que reduzcan una calificación.

**Consecuencias.** El progreso es más útil que un porcentaje, puede recalcularse con una nueva versión sin borrar el resultado histórico y funciona offline. El contenido necesita rubricas explícitas y tipos de evidencia compatibles.

**Si se aplaza.** Actividades y persistencia se modelarán alrededor de “completado”, y cambiar luego a evidencia requerirá migrar sesiones sin datos suficientes.

**Clasificación.** **B0 — bloqueante antes de programar.**

**Archivos o modelos afectados.** Nuevos `CompetencyDefinition`, `EvidenceRecord`, `AssessmentRuleVersion`, `AssessmentResult`, `MasteryState`, `LearningProgress`; esquema de paquetes, repositorios de sesión y vistas de progreso.

---

### 9. D13 — Compatibilidad con `.wplab` y bases de datos existentes

**Por qué es necesaria.** Los proyectos técnicos existentes son el activo que Aprender debe reutilizar, no convertir en datos cautivos. Añadir educación no debe hacer ilegibles archivos antiguos, forzar v6 al abrirlos ni mezclar progreso personal con un proyecto compartible.

**Partes de la arquitectura afectadas.** Serialización, ZIP `.wplab`, migraciones v5/v6, SQLite, IndexedDB, importación/exportación, backup y pruebas de compatibilidad.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Crear `.wplab` v2 inmediatamente | Contrato limpio | Ruptura y migración desproporcionadas antes de necesitarla |
| Incluir todo el estado educativo en cada `.wplab` | Portabilidad completa | Filtra perfiles/conversaciones, aumenta tamaño y mezcla ámbitos |
| **Mantener contenedor v1 con entradas educativas opcionales y DB separada** | Compatibilidad máxima; privacidad; adopción incremental | El exportador debe gestionar una selección explícita de dossier |
| Guardar solo en una base global | Sencillo | No permite compartir una práctica o evidencia seleccionada con el proyecto |

**Recomendación concreta.** Mantener `.wplab` **container format v1** mientras las nuevas entradas sean opcionales. Un proyecto técnico guarda su `project.json` v5 o v6 según necesidad. Aprender puede añadir, solo por inclusión explícita, `learning/manifest.json`, sesiones seleccionadas y evidencias seleccionadas. Nunca incluye por defecto perfil global, historial completo, analítica, copias privadas de libros ni conversaciones del tutor. Los lectores actuales deben ignorar entradas desconocidas; los nuevos lectores aceptan proyectos v2–v6 y preservan campos desconocidos que puedan conservar con seguridad.

Un proyecto educativo no es otro subtipo de `WatchProject`. `LearningSession` referencia opcionalmente un proyecto técnico y fija su fingerprint base; conserva aparte escenario, estado didáctico, errores inyectados, intentos y deltas reversibles. Un proyecto técnico puede tener muchas sesiones. Un caso sin proyecto usa una plantilla canónica de solo lectura. Solo `ProjectChangeProposal`, revisada y aceptada, aplica un delta al proyecto; reabrir una sesión nunca lo hace implícitamente.

SQLite usa migraciones numeradas y transaccionales, una tabla `schema_migrations` y backup previo a migrar. No se reescriben blobs `.wplab` existentes en segundo plano. IndexedDB sigue los mismos contratos de repositorio, no el mismo formato físico. `.wplab` v2 se reserva para un cambio obligatorio que un lector v1 no pueda ignorar.

**Consecuencias.** Se pueden compartir proyectos técnicos limpios y, cuando se desee, un dossier educativo mínimo. Las pruebas deberán cubrir lectura de fixtures antiguos, round-trip sin pérdida y rechazo seguro de versiones futuras obligatorias.

**Si se aplaza.** La primera persistencia educativa puede acoplarse al ZIP o a las tablas técnicas, haciendo difícil recuperar privacidad y retrocompatibilidad.

**Clasificación.** **B0 — bloqueante antes de programar** a nivel de política y límites; las migraciones concretas se implementan en el Sistema 2.

**Archivos o modelos afectados.** `src/data/designMigration.ts`, `src/vnext/model.ts`, `src/vnext/store.ts`, `src/platform/native.ts`, `src-tauri/src/lib.rs`, fixtures `.wplab`; nuevos `LearningDossierManifest`, `LearningRepository`, migraciones SQLite e IndexedDB.

---

### 10. D05 — Perfil local y persistencia de progreso, sesiones y evidencias

**Por qué es necesaria.** Progreso, intentos y evidencias tienen ciclos de vida distintos del proyecto técnico. Se necesita decidir identidad local, granularidad, borrado y reconstrucción antes de crear tablas o stores.

**Partes de la arquitectura afectadas.** Estado de aplicación, repositorios, SQLite, IndexedDB, privacidad, exportación, evaluación, multiusuario local y recuperación.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Sin perfiles, un estado global | Mínimo esfuerzo | Confunde usuarios de un mismo equipo y dificulta exportar/borrar |
| Cuenta remota obligatoria | Sincronización e identidad fuertes | Rompe offline y obliga a operar un servicio y tratar más datos personales |
| **Perfil local por defecto y perfiles locales adicionales opcionales** | Cero fricción, offline, separable y ampliable | No sincroniza entre equipos en la primera versión |
| Archivos sueltos por sesión | Fácil inspección | Índices, transacciones y migraciones pobres |

**Recomendación concreta.** Crear automáticamente un perfil local pseudónimo al primer uso, sin login, y permitir perfiles adicionales. SQLite es la autoridad en escritorio; IndexedDB implementa el subconjunto web. Separar:

- `learning_profiles` para preferencias mínimas;
- `learning_sessions` para contexto, versiones y estado reversible;
- `learning_events` append-only para intentos y acciones relevantes;
- `learning_evidence` inmutable para artefactos evaluables;
- `learning_assessments` para resultados derivados y versión de regla;
- `learning_mastery` como proyección reconstruible, no única fuente histórica.

Los snapshots aceleran apertura, pero los eventos y evidencias conservan trazabilidad. Deben existir exportación, borrado por perfil y retención configurable. En v1 no se cifra la base dentro de la aplicación: se confía en permisos/cifrado del sistema operativo y se evita almacenar secretos; se deja una interfaz de repositorio para cifrado futuro.

**Consecuencias.** Varios alumnos pueden usar un equipo sin cuenta. El progreso se recupera y recalcula. La sincronización futura tendrá que resolver IDs y eventos, pero no obliga a cambiar los modelos.

**Si se aplaza.** El estado caerá en el store global o dentro del proyecto, con pérdida de trazabilidad y una migración compleja para separar personas.

**Clasificación.** **Fase — necesaria antes del Sistema 2 (persistencia) y de guardar la primera sesión; no bloquea el shell y contratos del Sistema 1.**

**Archivos o modelos afectados.** `src/vnext/store.ts`, `src/platform/native.ts`, `src-tauri/src/lib.rs`; nuevos `LearnerProfile`, `LearningSession`, `LearningEvent`, `EvidenceRecord`, `AssessmentResult`, repositorios SQLite/IndexedDB y políticas de retención.

---

### 11. D12 — Alcance web y funcionamiento sin conexión

**Por qué es necesaria.** La aplicación tiene superficie web y de escritorio, pero CAD, archivos grandes y filesystem nativo no tienen la misma capacidad en ambas. “Funciona offline” debe traducirse en un contrato verificable y no en una promesa genérica.

**Partes de la arquitectura afectadas.** Repositorios, caché, service worker futuro, IndexedDB, shell web, detección de capacidades, contenidos, CAD sidecar y UX de descarga.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Paridad completa web/escritorio | Mensaje simple | Irrealista para CAD nativo y activos pesados; alto coste de soporte |
| Aprender solo en escritorio | Una plataforma | Pierde lectura y práctica ligera accesibles desde navegador |
| **Dominio común con matriz de capacidades y offline explícito** | Una semántica, degradación honesta y buen uso de cada plataforma | Exige diseñar estados de capacidad y paquetes descargables |
| Web dependiente siempre de servidor | Implementación de datos centralizada | Contradice local-first y bloquea taller/aula sin red |

**Recomendación concreta.** Tratar web como **superficie acompañante soportada**, no como clon de escritorio. Ambos comparten modelos, evaluación y repositorios abstractos. Una ruta, lección o actividad declara capacidades (`content`, `2d`, `webgl`, `cad`, `filesystem`, `large-assets`, etc.). En web deben funcionar offline, una vez descargados, texto, imágenes autorizadas, glosario, cuestionarios, progreso y prácticas 2D/3D compatibles. CAD exacto, importación STEP y activos fuera de cuota pueden requerir escritorio. Si falta una capacidad se muestra antes de iniciar, nunca durante una evaluación.

La primera versión puede usar caché de aplicación e IndexedDB sin sincronización. “Disponible sin conexión” solo se muestra cuando manifiesto, objetos y todos los activos obligatorios han sido verificados por hash.

**Consecuencias.** Las mismas actividades pueden tener variantes según capacidad sin alterar la competencia evaluada. Habrá pruebas de modo avión y gestión de descargas. No se promete edición técnica completa en navegador.

**Si se aplaza.** Contenido y UI asumirán APIs nativas, haciendo que la web sea accidentalmente incompleta o requiera un fork.

**Clasificación.** **Fase — necesaria antes del Sistema 2 para repositorios y antes del Sistema 3 para viewport; no bloquea los contratos puros iniciales.**

**Archivos o modelos afectados.** `src/platform/native.ts`, `src/vnext/desktopConfig.test.ts`, `src/vnext/engine.ts`, configuración Vite/PWA futura; nuevos `CapabilitySet`, `OfflineAvailability`, repositorio IndexedDB, gestor de caché y manifiesto de activos.

---

### 12. D18 — Almacenamiento, cuotas, deduplicación y copias de seguridad

**Por qué es necesaria.** Libros, imágenes, modelos y paquetes pueden crecer mucho más que el estado estructurado. Mezclarlos en la base o duplicarlos en cada backup hace lenta y frágil la recuperación.

**Partes de la arquitectura afectadas.** Asset store, SQLite, IndexedDB, paquetes descargados, copias privadas, migraciones, restauración y ajustes.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Todos los binarios dentro de SQLite | Transacciones y copia única | Base enorme, backups lentos y peor streaming |
| Árbol de archivos por curso | Comprensible manualmente | Duplicados, colisiones y referencias rotas al renombrar |
| **Metadatos en DB + almacén de objetos por hash** | Deduplicación, integridad, backups pequeños y activos inmutables | Requiere recolección de huérfanos y verificador de hashes |
| Solo almacenamiento en nube | Reduce disco local | No funciona offline y añade dependencia operativa |

**Recomendación concreta.** Guardar metadatos y referencias en SQLite/IndexedDB, y binarios en un almacén direccionado por SHA-256. En escritorio no imponer límite duro: usar una **cuota blanda configurable de 5 GB** para contenido gestionado/descargado, avisar antes de superarla y permitir ampliarla. Los documentos enlazados fuera de WPL no se copian salvo importación expresa. En web, calcular cuota disponible y reservar antes de descargar.

Crear backup transaccional antes de cada migración; además, conservar por defecto 7 copias diarias y 4 semanales de la base y manifiestos. No duplicar en cada copia los binarios inmutables: mantener un inventario de hashes, verificación y una exportación de recuperación que pueda incluirlos. La recolección de activos huérfanos tiene periodo de gracia y nunca borra mientras exista una referencia o backup vigente.

**Consecuencias.** Los paquetes comparten activos idénticos, las copias son rápidas y la corrupción puede detectarse. Ajustes deberá explicar espacio usado, origen, clasificación de uso y posibilidad de re-descarga.

**Si se aplaza.** Los primeros paquetes tenderán a duplicar archivos y la estrategia de backup se verá obligada a copiar bases de varios gigabytes o perder activos privados.

**Clasificación.** **Fase — necesaria desde el Sistema 2 para el almacén y antes de la biblioteca completa del Sistema 8.** La política de backup de base debe existir desde el Sistema 2. El valor exacto de la cuota blanda es **aplazable/configurable** sin deuda.

**Archivos o modelos afectados.** `src/platform/native.ts`, `src-tauri/src/lib.rs`; nuevos `AssetDescriptor`, `AssetReference`, `ContentAddressedStore`, `StorageQuotaPolicy`, `BackupManifest`, verificador y recolección de huérfanos.

---

### 13. D10 — Trazabilidad metrológica y promoción de observaciones

**Por qué es necesaria.** Una medida tomada por el alumno, un valor de catálogo y una dimensión exacta del proyecto no son intercambiables. Promover observaciones sin incertidumbre puede alterar cálculos técnicos y falsas compatibilidades.

**Partes de la arquitectura afectadas.** Prácticas de medición, `Dimension`, evidencias, geometría, validación, propuestas de cambio, instrumental y evaluación.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Guardar solo el valor final | UI sencilla | Pierde instrumento, repetición, resolución e incertidumbre |
| Copiar automáticamente al proyecto | Flujo rápido | Contamina el estado técnico con errores didácticos |
| **Observación inmutable + estimación derivada + promoción revisada** | Trazabilidad completa y separación segura | Más pasos y modelos de datos |
| No permitir promoción | Máxima protección | Duplica trabajo y desaprovecha mediciones válidas |

**Recomendación concreta.** Normalizar internamente mm, grados, horas, A/h y conteos, conservando unidad introducida. `MeasurementObservation` registra valor bruto, instrumento, resolución, calibración/fecha, método, condiciones, autor y repetición. `MeasurementEstimate` agrega observaciones, incertidumbre y regla de cálculo. Solo `ProjectChangeProposal`, con diff, justificación, procedencia y confirmación explícita, puede crear o actualizar una `Dimension`; la acción es deshacible y dispara de nuevo las validaciones afectadas. Una envolvente importada de STEP se etiqueta como geometría importada, no como medición de una interfaz funcional.

**Consecuencias.** Medir puede evaluarse sin arriesgar el proyecto. Una estimación aceptada mantiene vínculo a sus datos brutos. Los informes distinguen nominal, catálogo, medido, inferido y simulado.

**Si se aplaza.** Los valores se almacenarán como números sin contexto y no habrá forma fiable de decidir cuáles pueden alimentar ingeniería.

**Clasificación.** **Fase — necesaria antes del Sistema 7 (metrología) y antes de cualquier escritura educativa al proyecto.**

**Archivos o modelos afectados.** `src/types.ts`, `src/core/tolerance.ts`, `src/core/engineering.ts`, `src/logic/validation.ts`, `src/vnext/geometry.ts`; nuevos `MeasurementObservation`, `InstrumentRecord`, `MeasurementEstimate`, `ProjectChangeProposal` y extensiones de procedencia de `Dimension`.

---

### 14. D11 — Donantes forzados y compatibilidad insuficiente

**Por qué es necesaria.** En restauración puede elegirse una pieza donante aunque la evidencia sea incompleta o alguna regla falle. La aplicación debe permitir el juicio profesional sin reescribir el diagnóstico original como “compatible”.

**Partes de la arquitectura afectadas.** Compatibilidad, flujo de decisión, informes, proyecto, evaluación, evidencias y recalculado.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Bloquear cualquier donante no compatible | Seguridad | Impide casos reales y decisiones expertas justificadas |
| Permitirlo sin registro | Flexibilidad | Borra riesgos y hace el informe engañoso |
| Cambiar el resultado a “compatible por usuario” | UI simple | Mezcla evaluación técnica con decisión operativa |
| **Mantener evaluación y añadir una decisión de override trazable** | Preserva hechos, autonomía y auditoría | Requiere estados y advertencias persistentes |

**Recomendación concreta.** La compatibilidad usa `compatible`, `incompatible` e `insufficient_data`; “forzado” no es un cuarto resultado, sino un `DonorOverrideDecision`. Debe registrar evaluación original, pieza y revisión, usuario, fecha, justificación, riesgos aceptados y comprobaciones requeridas. El proyecto mantiene una advertencia visible mientras el riesgo siga activo. Se permite exportar, pero el informe técnico incluye el override y no puede suprimir la evaluación original. Cualquier cambio de dimensión, pieza o condición vuelve a ejecutar todos los informes dependientes.

**Consecuencias.** WPL apoya restauración real sin certificar lo que no ha validado. La evaluación educativa puede valorar la calidad de la justificación por separado del resultado técnico.

**Si se aplaza.** Los usuarios recurrirán a notas libres o modificarán datos para superar un bloqueo, destruyendo trazabilidad.

**Clasificación.** **Fase — necesaria antes del Sistema 7 (metrología y donantes).**

**Archivos o modelos afectados.** `src/core/componentCompatibility.ts`, `src/core/engineering.ts`, `src/core/interactiveReport.ts`, `src/logic/validation.ts`, `src/vnext/EngineeringPanels.tsx`; nuevos `CompatibilityAssessment`, `DonorOverrideDecision`, `AcceptedRisk` y dependencias de recalculado.

---

### 15. D09 — Arquitectura futura del tutor contextual

**Por qué es necesaria.** Un tutor necesita contexto de actividad, proyecto y evidencias, pero una integración directa con un modelo de IA introduciría red, privacidad, no determinismo y capacidad de mutar estado en el núcleo.

**Partes de la arquitectura afectadas.** Registro de contexto, actividad, evaluación, privacidad, conectividad, proveedores, UI conversacional y comandos de proyecto.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Sin tutor hasta disponer de IA | Menos arquitectura inicial | Pierde ayuda contextual básica y luego acopla IA al dominio |
| IA integrada directamente | Respuestas flexibles | No determinista, requiere conexión y puede filtrar datos o realizar acciones indebidas |
| **Tutor determinista inicial detrás de una interfaz de proveedor** | Offline, comprobable y prepara adaptadores futuros | Menos conversación libre al principio; exige diseñar actos estructurados |
| Solo documentación estática | Muy seguro | No usa contexto ni evidencia del alumno |

**Recomendación concreta.** Implementar primero un tutor determinista que consume `TutorContextSnapshot` mínimo y devuelve `TutorAct` estructurado: explicar término, señalar evidencia, proponer pista graduada, recomendar actividad, comparar estados o preparar una propuesta. Nunca modifica el proyecto, concede dominio ni ejecuta comandos. Definir desde el contrato `TutorProvider`; un adaptador IA futuro requerirá consentimiento explícito, minimización/redacción de datos, política de proveedor, indicador de red, registro de versión y fallback offline. La salida libre de IA se valida y transforma en actos permitidos antes de llegar a UI.

**Consecuencias.** Las funciones útiles llegan sin depender de terceros y se pueden probar. Una IA futura mejora explicación, no obtiene autoridad técnica ni de evaluación.

**Si se aplaza.** La ayuda contextual aparecerá dispersa en componentes o la primera IA leerá stores completos, creando acoplamiento y riesgo de privacidad.

**Clasificación.** **Aplazable en capacidad:** la IA puede posponerse sin deuda. **Necesaria antes del Sistema 5:** la interfaz, el snapshot mínimo y los actos estructurados deben cerrarse antes del tutor determinista. El adaptador IA corresponde, como pronto, al Sistema 9.

**Archivos o modelos afectados.** Futuros `TutorProvider`, `TutorContextSnapshot`, `TutorAct`, `TutorPolicy`, adaptadores determinista/IA, componentes de tutor y registros de consentimiento.

---

### 16. D14 — Dispositivos de entrada e interacciones soportadas

**Por qué es necesaria.** Seleccionar una pieza, girarla, medirla o seguir un montaje puede depender de hover, arrastre o precisión de puntero. Si la semántica se codifica directamente en eventos de ratón, teclado y táctil quedarán como añadidos defectuosos.

**Partes de la arquitectura afectadas.** Viewport, comandos, selección, timeline, herramientas de medición, accesibilidad, responsive y pruebas de interacción.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Solo ratón en escritorio | Menor esfuerzo | Excluye teclado/touch y acopla dominio a gestos |
| Paridad total ratón/touch desde el día uno | Cobertura amplia | La precisión de taller no se traslada bien a pantallas táctiles; gran matriz de QA |
| **Acciones semánticas con baseline ratón/trackpad/teclado; touch graduado** | Accesible, testeable y ampliable; protege operaciones de precisión | Hay que diseñar alternativas de selección y confirmación |
| SpaceMouse como requisito | Buena navegación 3D experta | Hardware minoritario y API adicional |

**Recomendación concreta.** El baseline de escritorio es ratón o trackpad **más teclado completo**; toda acción esencial tiene comando semántico, foco visible y alternativa sin arrastre. Touch soporta lectura, navegación, selección, timeline y prácticas que no requieran precisión; montaje fino y metrología pueden declararse `desktopPrecisionRequired` hasta disponer de una interacción táctil validada. Gamepad y SpaceMouse quedan como adaptadores opcionales posteriores. Las lecciones solicitan capacidades, nunca un gesto concreto.

**Consecuencias.** `ViewportIntent` y el command bus reciben acciones como `selectPart`, `rotateAssemblyStep` o `confirmMeasurement`, no `mousedown`. Se podrá automatizar la UI y añadir dispositivos sin tocar las reglas educativas.

**Si se aplaza.** Las actividades incrustarán coordenadas y gestos de ratón; hacerlas accesibles o táctiles exigirá reescribirlas.

**Clasificación.** **Fase — necesaria antes del Sistema 3 (bridge del viewport) y de publicar montaje en el Sistema 6.** SpaceMouse/gamepad son aplazables sin deuda.

**Archivos o modelos afectados.** `src/vnext/StudioViewport.tsx`, `src/vnext/Controls.tsx`, `src/components/Controls.tsx`, `src/vnext/engine.ts`; nuevos `LearningCommand`, `InputCapability`, keymap y adaptadores de puntero/touch.

---

### 17. D15 — Objetivo de accesibilidad

**Por qué es necesaria.** Aprender añade navegación compleja, 3D, color, temporización, arrastre y evaluación. Corregir semántica, orden de foco o alternativas al grafo después de construir el shell es mucho más costoso.

**Partes de la arquitectura afectadas.** Design system, shell, mapa de conocimiento, viewport, contenidos, evaluación, multimedia, atajos y criterios de aceptación.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| “Buenas prácticas” sin objetivo verificable | Flexible | No define salida ni evita regresiones |
| WCAG 2.2 AAA total | Ambicioso | No es viable como requisito general para toda visualización 3D |
| **WCAG 2.2 AA + equivalentes funcionales para 3D/escritorio** | Estándar comprobable y alcance realista; cubre teclado, foco, tamaño de objetivo y arrastre | Requiere auditoría continua y algunas vistas alternativas |
| Accesibilidad después del primer lanzamiento | Acelera demos | Consolida componentes y contenidos inaccesibles |

**Recomendación concreta.** Adoptar [WCAG 2.2 nivel AA](https://www.w3.org/TR/WCAG22/) para la interfaz web y aplicar sus principios al escritorio, usando la [guía WCAG2ICT](https://www.w3.org/TR/wcag2ict-22/) donde corresponda. El grafo siempre dispone de árbol/lista equivalentes; el color nunca es la única codificación; animaciones admiten pausa, scrubbing y movimiento reducido; toda operación por arrastre tiene alternativa; audio/vídeo tiene transcripción o subtítulos; el viewport expone selección, descripción y acciones por una representación accesible. Las adaptaciones no penalizan evaluación.

**Consecuencias.** Accesibilidad pasa a criterios de aceptación, pruebas de teclado y revisión editorial, no a un modo separado. Algunas experiencias 3D necesitarán una vista textual estructurada equivalente.

**Si se aplaza.** El orden DOM, los widgets, rubricas temporizadas y contenidos multimedia crearán deuda transversal difícil de corregir sin rediseño.

**Clasificación.** **Fase — necesaria antes del Sistema 4 (shell UX); sus criterios se aplican desde el primer componente y en cada sistema.**

**Archivos o modelos afectados.** `src/App.tsx`, `src/App.css`, `src/index.css`, `src/vnext/Sidebar.tsx`, `src/vnext/StudioViewport.tsx`, componentes futuros de mapa/tutor/práctica; `AccessibilityPreferences`, metadatos de contenido y suite de pruebas a11y.

---

### 18. D16 — Arco editorial inicial

**Por qué es necesaria.** El orden de publicación define qué capacidades técnicas deben madurar primero y evita que la plataforma se construya alrededor de una sola demostración vistosa sin progresión pedagógica.

**Partes de la arquitectura afectadas.** Roadmap, paquetes, fixtures, activos, mapa de conocimiento, evaluación, QA por movimiento y criterios de publicación.

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| Empezar por desmontaje completo | Valor visual inmediato | Demasiados conceptos, activos y riesgos antes de validar fundamentos |
| Solo teoría común | Barato y reusable | Poca transferencia práctica y débil validación del viewport |
| Solo MIYOTA 2035 | Aprovecha trabajo existente | Sesga arquitectura a cuarzo y no prueba montaje mecánico profundo |
| **Del cuarzo conocido a la familia MIYOTA 2035/82/90 y después diseño** | Progresión comprobable, alta reutilización de fuentes y comparación entre familias relacionadas | Exige modularizar el 8215 automático/calendario y sostener un arco largo |

**Recomendación concreta.** Habilitar el contenido en este orden:

1. fundamentos, seguridad, herramientas, unidades y documentación;
2. del ISA 8172 conocido por el usuario al MIYOTA 2035;
3. funcionamiento completo del cuarzo MIYOTA 2035;
4. fundamentos del reloj mecánico;
5. MIYOTA 8215 por subsistemas;
6. desmontaje y montaje completo del MIYOTA 8215;
7. inspección, lubricación, regulación y diagnóstico del 8215;
8. comparación con 82S0 y 8N24;
9. comparación entre serie 82 y serie 90;
10. MIYOTA 9015 y 9039;
11. calendarios, reserva de marcha y movimientos MIYOTA más complejos;
12. contenido avanzado del libro: escapes, cronógrafos, tourbillones, remontoir, repetición, calendarios perpetuos y diseño integral;
13. componentes donantes y construcción de un movimiento híbrido;
14. diseño y documentación de un reloj completo.

Cada unidad se habilita solo si cumple la matriz mínima de activos, procedencia, fidelidad, rubricas y accesibilidad, aunque el shell muestre su posición futura como “próximamente”. El material del libro puede alimentar las unidades avanzadas como fuente privada y capa derivada, sin convertirse en especificación MIYOTA ni incrustarse en un paquete exportable.

**Consecuencias.** Los primeros sistemas se validan contra dos topologías MIYOTA distintas. El 8215 obliga a que escenas, evaluación y montaje puedan activar progresivamente núcleo, calendario y automático sin bifurcar el canon. Las series 82 y 90 convierten variante/familia/comparación en capacidades explícitas. El contenido avanzado documental puede avanzar antes que su simulación, siempre etiquetado con fidelidad honesta.

**Si se aplaza.** Las prioridades de motor, activos y contenido competirán sin un criterio común, y se pueden terminar capacidades que no habilitan ninguna unidad publicable.

**Clasificación.** **Fase — necesaria antes de producir el backlog editorial del Sistema 4 y contenido evaluable del Sistema 5.** Las unidades posteriores al servicio completo son aplazables sin deuda estructural.

**Archivos o modelos afectados.** Paquetes `fundamentals`, `isa-8172-to-miyota-2035`, `miyota-2035`, `miyota-8215`, `miyota-82-family`, `miyota-90-family`, `advanced-horology`, `hybrid-movement` y `complete-watch`; `LearningPath`, `CapabilityMatrix`, fixtures, catálogos, activos y plan editorial.

## 4. Dependencias y secuencia de cierre

La numeración siguiente corresponde al orden en que conviene aprobar y materializar los contratos:

1. **Identidad:** D01 fija nombres estables.
2. **Verdad del producto:** D03 fija identidades físicas y D04 fija la autoridad de cada resultado.
3. **Caso de referencia:** D02 selecciona los movimientos contra los que se prueba el contrato.
4. **Contenido local trazable:** D06 fija procedencia/uso/exportación; D17, terminología; D07, formato y gobierno local; D08, evaluación.
5. **Compatibilidad y estado:** D13 protege formatos existentes; D05 separa identidad, sesión y evidencia; D12 fija capacidades offline; D18 organiza activos y recuperación.
6. **Flujos especializados:** D10 controla medidas y promoción; D11 controla decisiones excepcionales; D09 limita al tutor.
7. **Experiencia y publicación:** D14 abstrae entrada; D15 impone accesibilidad; D16 ordena el arco editorial.

Relaciones críticas:

- D03 → D04 → D10/D11: no se puede promover una medida ni forzar un donante sin entidad canónica y autoridad de evidencia.
- D02 → jerarquía de fuentes → D16: el calibre elegido determina la autoridad documental y el arco que puede sostenerse honestamente.
- D07 → D08 → D05: la sesión fija versiones de contenido y reglas; la persistencia conserva esa combinación.
- D03 + D05 → D13: el contenedor debe distinguir proyecto canónico, dossier seleccionado y progreso personal.
- D12 + D14 + D15 → D16: cada unidad editorial solo se publica si su matriz de dispositivo, offline y accesibilidad es satisfactoria.
- D04 + D08 → D09: el tutor explica evidencia, pero no adquiere autoridad de validación ni evaluación.

## 5. Decisiones que deben resolverse antes del primer cambio de código

La implementación no debe empezar hasta aprobar estas siete decisiones como conjunto:

1. **D01 — nombre:** Aprender / Learn; Watchmaking Academy solo editorial; `learning` interno.
2. **D03 — canon:** contrato v6 general y aditivo con instancias, interfaces y dependencias; adaptador v5; elevación persistida solo cuando sea necesaria.
3. **D04 — fidelidad:** ejes G/K/P y separación tipada, visual y operativa entre simulación educativa y validación de ingeniería.
4. **D02 — referencia inicial:** MIYOTA 2035 para cuarzo y 8215 para mecánica profunda; 82S0/8N24 y 9015/9039 como comparación; otros MIYOTA después; arquitectura multimarca.
5. **D07 — contenido:** paquetes ZIP declarativos, JSON/Markdown restringido, esquema v1, SemVer y hashes; integrados o locales/no firmados sin código arbitrario.
6. **D08 — evaluación:** evidencias y rubricas deterministas versionadas; estados de dominio; IA sin autoridad evaluadora.
7. **D13 — compatibilidad:** `.wplab` v1 aditivo y opt-in para dossier; perfil/progreso y fuentes privadas fuera del proyecto; migraciones de DB transaccionales.

La aprobación de D03 no significa programar toda v6 antes de mostrar el shell; significa impedir que el primer código cree una identidad alternativa incompatible. De igual modo, aprobar D07 no exige construir ya la herramienta visual de autoría, sino fijar el formato que leerán runtime y pruebas.

## 6. Tabla resumen

| Orden | Decisión | Recomendación | Prioridad | Fase afectada | Bloqueante antes de programar |
|---:|---|---|---|---|:---:|
| 1 | D01 Nombre | Aprender/`learning`; Watchmaking Academy editorial | P0 | Sistema 0 y shell | **Sí** |
| 2 | D03 Canon v6 | Grafo general aditivo de instancias/interfaces con adaptador v5 | P0 | Sistemas 0–1; persistencia gradual | **Sí** |
| 3 | D04 Fidelidad | Ejes G/K/P y pipelines educativo/ingeniería separados | P0 | Sistemas 0–1 y todos los simuladores | **Sí** |
| 4 | D02 Calibre inicial | 2035 cuarzo + 8215 mecánico; familias 82/90 después; core multimarca | P0 | Sistemas 0–1, 6 y 9 | **Sí** |
| 5 | D06 Fuentes privadas | Clasificación simple, capas separadas y exportación opt-in | P1 | Sistemas 2 y 8 | No |
| 6 | D17 Terminología | IDs neutros y glosario ES/EN versionado | P1 | Sistemas 2 y 4–5 | No |
| 7 | D07 Contenido | ZIP declarativo, schema v1, SemVer; integrado o local/no firmado | P0 | Sistemas 0 y 2 | **Sí** |
| 8 | D08 Evaluación | Evidencia/rubrica versionada y dominio explicable | P0 | Sistemas 0, 2 y 5 | **Sí** |
| 9 | D13 Compatibilidad | `.wplab` v1 aditivo opt-in; DB separada y migraciones | P0 | Sistemas 0 y 2 | **Sí** |
| 10 | D05 Persistencia | Perfil local por defecto; eventos/evidencias separados | P1 | Sistemas 2 y 5 | No |
| 11 | D12 Web/offline | Dominio común, matriz de capacidades y descargas verificadas | P1 | Sistemas 2–4 | No |
| 12 | D18 Almacenamiento | Objetos por hash, cuota blanda y backups rotatorios | P1 | Sistemas 2 y 8 | No |
| 13 | D10 Metrología | Observación inmutable y promoción revisada/deshacible | P1 | Sistema 7 | No |
| 14 | D11 Donantes | Override trazable sin alterar la evaluación original | P1 | Sistema 7 | No |
| 15 | D09 Tutor | Determinista y estructurado; IA opcional detrás de provider | P1/P2 | Sistemas 5 y 9 | No |
| 16 | D14 Dispositivos | Acciones semánticas; ratón/teclado base; touch graduado | P1 | Sistemas 3, 4 y 6 | No |
| 17 | D15 Accesibilidad | WCAG 2.2 AA y equivalentes funcionales del 3D | P1 | Desde Sistema 3; cierre en 4 | No |
| 18 | D16 Arco editorial | ISA 8172 → 2035 → 8215 → familias 82/90 → avanzado → diseño | P1 | Sistemas 4–9 | No |

## 7. Resultado de aprobación esperado

Una aprobación conjunta de las siete decisiones B0 autoriza redactar ADRs y contratos del Sistema 0. Las once decisiones restantes pueden considerarse **orientación aprobada** con fecha límite por fase: no necesitan bloquear ese primer trabajo, pero cualquier cambio posterior que contradiga la configuración integrada debe registrarse como una nueva decisión y revisar sus dependencias. Hasta esa aprobación, el Sistema 0 permanece detenido.

Este documento no modifica por sí mismo esquemas, código, bases de datos, paquetes ni archivos `.wplab`; fija la propuesta de diseño que precede a la implementación.

## 8. Estado posterior a la aprobación

El 2026-07-22 el usuario aprobó conjuntamente D01, D03, D04, D02, D07, D08 y D13 y autorizó Sistema 0. Los contratos resultantes están fijados por los ADR de `docs/adr/` y descritos contra la implementación real en `docs/APRENDER-SISTEMA-0.md`. Las once decisiones restantes conservan la prioridad y fecha límite de este informe; no se consideran resueltas por la implementación de fundamentos.
