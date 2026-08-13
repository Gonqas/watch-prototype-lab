# Aprender / Watchmaking Academy — visión de producto

Estado: revisión para validación, no implementación ni inicio del Sistema 0.  
Fecha de auditoría: 2026-07-22.

## 1. Resumen ejecutivo

`Aprender` debe ser una nueva área de producto de primer nivel de Watch Prototype Lab, no una colección de artículos. Su unidad de aprendizaje es una interacción verificable con el reloj o movimiento activo: observar, aislar, medir, formular una hipótesis, intervenir, validar y explicar.

La primera etapa es **privada, local y para uso personal**. No presupone marketplace, cuentas, publicación ni comercialización. La biblioteca privada —incluido el libro de horología del usuario— forma parte del espacio de trabajo local, pero se mantiene separada de los proyectos y paquetes exportables.

La propuesta conserva una sola verdad técnica: `WatchProject` y sus futuras extensiones canónicas. El contenido educativo referencia entidades, dimensiones, informes y geometría de ese proyecto; nunca mantiene una copia física alternativa. Las escenas, averías y ejercicios operan sobre una sesión reversible y registran qué parte es evidencia, qué parte es cálculo y qué parte es simulación educativa.

El contenido inicial se concentra en el ecosistema MIYOTA: 2035 para cuarzo, 8215 para mecánica profunda, 82S0/8N24 para observación abierta y 9015/9039 para comparar la serie 90; 9100/9120 y otras variantes amplían complicaciones. Esta prioridad es editorial y de fixtures: el canon, los selectores y los motores siguen siendo multimarca.

La visión completa se organiza como una academia-laboratorio con nueve sistemas coordinados:

1. grafo de conocimiento;
2. orquestador declarativo de escenas 3D;
3. visualizaciones funcionales con nivel de evidencia;
4. prácticas y evaluación basada en acciones;
5. montaje/desmontaje virtual;
6. laboratorio de averías y diagnóstico;
7. metrología y banco de donantes;
8. biblioteca técnica contextual;
9. proyectos largos y tutor contextual.

No se propone un MVP reducido. La implementación se divide por dependencias técnicas, manteniendo desde el principio los contratos de la visión completa.

## 2. Resultado de producto buscado

Una persona debe poder entrar con conocimientos limitados y, sobre movimientos concretos, acumular evidencia hasta ser capaz de:

- reconocer piezas, interfaces y subsistemas;
- explicar el flujo de energía en cuarzo y mecánico;
- desmontar y montar respetando dependencias, orientación, herramientas y riesgos;
- inspeccionar, limpiar, lubricar y regular con procedimientos trazables;
- diagnosticar síntomas mediante pruebas e hipótesis, no por adivinación;
- medir piezas reales con incertidumbre e incorporar mediciones revisadas al proyecto;
- evaluar donantes y documentar trasplantes condicionados o forzados;
- calcular trenes, diseñar platinas y puentes y construir movimientos híbridos;
- completar un expediente de reloj con decisiones, validaciones y limitaciones.

La academia también debe servir a usuarios expertos como modo de inspección, explicación y documentación de un proyecto real. Aprendizaje guiado y exploración libre comparten el mismo contexto técnico.

## 3. Principios no negociables

### 3.1 Una sola fuente física

El movimiento abierto sigue siendo el del proyecto técnico. `Aprender` añade referencias, sesiones, evidencias y proyecciones visuales; no duplica cotas, topología, tolerancias ni procedencia.

Cuando el modelo actual no tenga granularidad suficiente —por ejemplo, tornillos individuales o piezas internas de un cuarzo— la interfaz debe decir `no modelado`, `representación visual` o `dato insuficiente`. El contenido no puede inventar una pieza canónica para completar una lección.

### 3.2 Verdad con alcance declarado

Toda afirmación calculada o visualizada debe llevar:

- origen del dato;
- método;
- alcance;
- fiabilidad;
- exactitud (`exacta`, `analítica`, `aproximada`, `parcial` o `indeterminada`);
- instante y versión del proyecto que la produjo.

`Exacto` se reserva para resultados que realmente proceden del kernel y cuya operación terminó correctamente. Una animación convincente no convierte un modelo cinemático o educativo en una simulación física exacta.

### 3.3 Aprender haciendo

Las explicaciones acompañan una acción: seleccionar, identificar, comparar, medir, ordenar, desmontar, montar, simular, probar o justificar. Una lección puede contener texto, pero no se completa por desplazarse hasta el final.

### 3.4 El error permanece visible

Un ejercicio no corrige silenciosamente el proyecto. Registra el error, muestra su consecuencia educativa, ofrece pistas graduadas y conserva la posibilidad de inspeccionar el estado. La restauración es una acción explícita o el cierre transaccional de la sesión.

### 3.5 Offline primero

El grafo, las escenas, los ejercicios, la evaluación determinista, las fuentes locales permitidas y el historial deben funcionar sin conexión. Un futuro proveedor de IA será opcional y recibirá contexto estructurado con controles de privacidad.

### 3.6 Topología variable

Los contenidos no suponen cinco ruedas, un único puente, una arquitectura fija ni la presencia de segundero central. Los selectores pueden pedir roles y capacidades; el resolvedor devuelve uno, varios, ninguno o una ambigüedad que el contenido debe gestionar.

### 3.7 Modo educativo explícito

Las averías inducidas, daños y consecuencias se etiquetan siempre como `simulación educativa`. Ninguna alteración de sesión se confunde con una medición del objeto real ni se guarda en el proyecto técnico sin revisión y confirmación.

### 3.8 Jerarquía de fuentes por ámbito

La autoridad depende del tipo de afirmación:

1. **documentación oficial MIYOTA** para nominales, funciones, dimensiones declaradas, referencias, planos, listas, despieces, frecuencia, rubíes, reserva y variantes;
2. **observaciones y mediciones propias** para la unidad física concreta, sus dimensiones, fotografías, desgaste, modificaciones y divergencias del nominal;
3. **libro privado de horología** para teoría, fabricación, herramientas, principios, trenes, escapes, regulación, diagnóstico, alta relojería y complicaciones;
4. **contenido educativo derivado** para traducciones privadas, explicaciones, diagramas, escenas, ejercicios, glosario e interpretaciones.

Un dato específico MIYOTA no se infiere solo del libro cuando exista documentación oficial aplicable. El libro no se presenta como manual exacto de servicio de un calibre salvo que lo trate expresamente. Nominal oficial y medición propia discrepante se conservan como claims distintos, no se sobrescriben.

### 3.9 Biblioteca privada por capas

Se permite importar documentos locales, conservar copias personales, ejecutar OCR local, traducir, explicar y anotar. Original, OCR, traducción y explicación son capas diferentes con procedencia, localizador y hash. Ninguna fuente privada se incluye por defecto en un `.wplab` o paquete exportado.

## 4. Arquitectura funcional completa

### 4.1 Inicio de Aprender

El inicio combina tres entradas, sin obligar a abandonar el proyecto:

- **Continuar**: sesión o proyecto educativo activo;
- **Ruta sugerida**: siguiente concepto o práctica según prerrequisitos y evidencia;
- **Explorar este movimiento**: mapa de conceptos aplicables al movimiento abierto.

También muestra datos críticos desconocidos, prácticas que pueden hacerse con el modelo actual y actividades bloqueadas por falta de granularidad o evidencia.

### 4.2 Mapa de conocimiento

Es un grafo navegable por tema, habilidad, pieza, subsistema, movimiento y proyecto. La vista puede filtrar:

- ruta recomendada;
- conceptos disponibles ahora;
- conceptos relacionados con la selección 3D;
- lagunas de conocimiento;
- contenidos no aplicables al movimiento actual;
- conceptos avanzados y caminos alternativos.

Los prerrequisitos son explícitos, pero la exploración libre no queda bloqueada: se muestra qué base falta y se permite abrir el concepto como consulta.

### 4.3 Laboratorio 3D educativo

El viewport central ejecuta un guion declarativo que controla cámara, visibilidad, aislamiento, explosionado, secciones, tiempo, overlays y preguntas. El usuario puede salir del guion y explorar cuando la práctica lo permita; la sesión registra esa desviación.

Las visualizaciones funcionales se activan por capas y solo aparecen cuando un proveedor de datos puede sostenerlas. El mismo overlay puede indicar valores distintos por pieza, incertidumbre y datos ausentes.

### 4.4 Prácticas

Tipos previstos:

- observación dirigida;
- identificación 3D;
- relación pieza–función;
- secuenciación;
- cálculo;
- medición;
- comparación;
- desmontaje/montaje;
- diagnóstico;
- diseño y validación;
- explicación libre;
- proyecto largo.

Cada práctica define objetivos, acciones observables, instrumentos disponibles, condiciones de éxito, pistas, penalizaciones, evidencia generada y política de restauración.

### 4.5 Taller de montaje y servicio

Cuatro modos comparten el mismo motor:

- **Guiado**: siguiente acción visible, riesgos anticipados y comprobación paso a paso.
- **Asistido**: objetivos y dependencias visibles; la siguiente acción no se revela salvo petición.
- **Libre**: herramientas y banco de piezas disponibles; se registran decisiones.
- **Evaluación**: ayudas limitadas, criterios congelados y expediente íntegro del intento.

El sistema registra orden, herramientas, piezas, tornillos, orientación, fuerza simulada, contaminación, lubricación, pasos omitidos, tiempo activo, errores, recuperación y resultado.

### 4.6 Laboratorio de averías

Una avería es un escenario reproducible con semilla y versión. Incluye estado base, alteraciones, síntomas, datos visibles/ocultos, pruebas posibles, hipótesis candidatas, diagnóstico esperado y rúbrica causal.

El objetivo no es elegir un nombre de fallo de una lista, sino seleccionar pruebas con coste, interpretar resultados, descartar hipótesis y explicar la cadena causal.

### 4.7 Taller de metrología

Permite crear campañas de medición sobre entidades canónicas. Registra observaciones repetidas, instrumento, resolución, calibración, método, condiciones, incertidumbre y confianza. El valor agregado no sustituye automáticamente una `Dimension`: se propone una actualización y el usuario revisa la promoción al modelo.

### 4.8 Donantes

El banco actual se convierte también en banco didáctico. Una práctica puede pedir al usuario que compare envolvente, depthing, pivotes, rubíes, frecuencia, puentes, tija, barrilete y rotor.

El resultado educativo distingue cinco estados:

- compatible;
- compatible con condiciones;
- incompatible;
- datos insuficientes;
- trasplante forzado.

El estado `trasplante forzado` describe una decisión registrada, no una propiedad intrínseca del donante.

### 4.9 Biblioteca técnica

Una fuente mantiene capas separadas:

1. original inmutable o referencia al original;
2. traducción identificada y versionada;
3. explicación sencilla;
4. interpretación técnica;
5. aplicación práctica;
6. vínculos al modelo 3D.

Las anotaciones nunca reescriben el original. La biblioteca puede registrar PDF local, documento oficial enlazado o descargado, página, figura o región, OCR, traducción, explicación y anotación. Cada elemento puede vincularse con conceptos, piezas, calibres, escenas y nivel de dificultad.

Para esta etapa personal, cada fuente usa una clasificación simple: `private-local`, `official-linked`, `official-cached`, `user-created`, `shareable` o `unknown`. La procedencia es obligatoria por rigor técnico y educativo; la infraestructura jurídica/editorial de distribución pública se aplaza.

### 4.10 Tutor contextual

El tutor es primero una interfaz de dominio, no un chat acoplado a un proveedor. Puede explicar, preguntar, sugerir una prueba, dar una pista, comparar, evaluar una explicación y señalar datos faltantes usando un paquete de contexto estructurado.

Debe citar qué fragmento del contexto sostiene cada afirmación y separar siempre:

- evidencia observada;
- resultado calculado;
- inferencia;
- hipótesis;
- simulación educativa;
- dato desconocido.

### 4.11 Progreso y evaluación

El progreso no es `lección completada`. Se deriva de evidencias:

- exposición y recuperación de conceptos;
- identificación correcta de piezas;
- acciones de práctica;
- calidad de mediciones;
- diagnósticos y razonamiento causal;
- secuencias de montaje;
- uso de pistas;
- errores repetidos;
- explicación bilingüe;
- resultados de proyectos.

Un concepto puede estar `no visto`, `expuesto`, `en práctica`, `demostrado` o `requiere retención`. Ningún estado de dominio se concede solo por abrir una pantalla.

### 4.12 Proyectos educativos

Un proyecto educativo es un expediente enlazado al proyecto técnico, no una copia. Puede abarcar reconstrucción de cuarzo, primer servicio mecánico, reparación, caracterización de donante, trasplante, diseño de platina, movimiento híbrido o reloj completo.

El expediente reúne objetivo, entidades, fuentes, medidas, incertidumbres, decisiones, errores, validaciones, lista de materiales, pasos y resultados. Puede incluir hitos y múltiples intentos.

## 5. Modos de visualización

Los modos son composiciones de herramientas y overlays, no nuevos renderizadores incompatibles:

| Modo | Pregunta principal | Capas dominantes |
|---|---|---|
| Técnico | ¿Qué es y cuánto mide? | cotas, datums, procedencia |
| Educativo | ¿Qué función cumple y con qué se relaciona? | etiquetas, entradas/salidas, conceptos |
| Montaje | ¿Qué puede retirarse o colocarse ahora? | dependencias, herramientas, riesgos |
| Flujo de energía | ¿De dónde viene y adónde va la energía? | rutas, par, pérdidas, confianza |
| Cinemática | ¿Cómo se mueve y con qué relación? | giro, velocidad, ratios, tiempo |
| Escape | ¿En qué fase está el ciclo? | bloqueo, caída, impulso, seguridad |
| Tolerancias | ¿Qué variación amenaza el montaje? | bandas, sensibilidad, fallos |
| Lubricación | ¿Dónde, con qué y cuánto? | puntos, aceite, cantidad, contaminación |
| Diagnóstico | ¿Qué síntoma, prueba e hipótesis están activos? | observables, pruebas, causalidad |
| Metrología | ¿Qué se mide y con qué incertidumbre? | referencias, instrumento, repeticiones |
| Donantes | ¿Qué interfaces coinciden o faltan? | superposición, diferencias, condiciones |
| Fabricación | ¿Es construible por el proceso elegido? | límites, accesibilidad, exportación |
| Evaluación | ¿Qué puede demostrar el usuario sin ayuda? | objetivo, tiempo, ayudas permitidas |

## 6. Límites honestos de la primera implementación

La visión exige contratos completos desde el inicio, pero la disponibilidad de ejercicios dependerá de la fidelidad de cada movimiento. El MIYOTA 2035 puede comenzar como sistema de cuarzo y crecer con anatomía interna. El MIYOTA 8215 será el primer calibre de servicio mecánico profundo: sus escenas introductorias pueden ocultar o desactivar rotor, automático y calendario para aislar el núcleo, sin eliminarlos del modelo canónico. 82S0/8N24 y 9015/9039 amplían comparación cuando sus activos y capacidades estén disponibles.

Un movimiento con envolvente comercial puede enseñar identificación general y stack, pero no un desmontaje interno evaluable. Un movimiento paramétrico puede enseñar tren y depthing, pero no servicio completo hasta tener tornillos, muelles, interfaces, estados y geometría suficientes.

La UI debe explicar el motivo de cada indisponibilidad y qué dato, activo o extensión canónica la resolvería.

## 7. Indicadores de éxito

Indicadores de producto:

- proporción de actividades con acciones 3D o mediciones observables;
- porcentaje de afirmaciones visuales con evidencia y exactitud visibles;
- capacidad de retomar una sesión sin alterar el proyecto técnico;
- número de movimientos soportados sin contenido condicional por calibre en el viewport;
- reducción de errores repetidos en intentos posteriores;
- expedientes exportables y auditables;
- funcionamiento completo de las rutas instaladas sin red.

Indicadores que se deben evitar:

- tiempo de lectura como sustituto de dominio;
- porcentaje de lecciones abiertas;
- animaciones atractivas sin correspondencia con el modelo;
- puntuación única sin evidencia consultable.

## 8. Documentos de esta propuesta

- [APRENDER-DECISIONES.md](./APRENDER-DECISIONES.md): decisiones integradas, prioridades B0 y configuración aprobable.
- [APRENDER-ARQUITECTURA.md](./APRENDER-ARQUITECTURA.md): auditoría, reutilización y arquitectura técnica.
- [APRENDER-MODELO-DATOS.md](./APRENDER-MODELO-DATOS.md): entidades, contratos y procedencia.
- [APRENDER-UX.md](./APRENDER-UX.md): navegación, pantallas e interacción.
- [APRENDER-CONTENIDO.md](./APRENDER-CONTENIDO.md): grafo, escenas, prácticas, diagnóstico y tutor.
- [APRENDER-IMPLEMENTACION.md](./APRENDER-IMPLEMENTACION.md): persistencia, compatibilidad, pruebas, fases y decisiones.
