# Watchmaking Academy · Sistemas 6, 7 y 8

Estado: implementados e integrados en Watch Prototype Lab 0.9.0.  
Fecha de corte: 2026-08-02.  
Ámbito: fabricación y acabados, ruta de diseño propio y validación.

## Resultado

La Academia incorpora tres rutas nuevas, 18 módulos, 18 lecciones de teoría primero, 18 prácticas estructuradas, 18 respuestas evaluables y 18 revisiones humanas. El cuerpo teórico nuevo contiene 15.221 palabras y funciona sin conexión una vez instalada la aplicación. Las fuentes externas se conservan como referencias trazables; los estándares completos no se redistribuyen.

La ampliación no convierte un formulario digital en una máquina, una revisión profesional o una acreditación manual. Cada actividad separa planificación, simulación, observación, medición y validación. Los proyectos técnicos se abren como referencia de solo lectura y no son mutados por las prácticas.

## Arquitectura común

Las tres rutas usan el mismo ciclo:

1. Teoría densa antes de la práctica.
2. Pregunta de trabajo y notas previas.
3. Revisión de fuentes y alcance.
4. Dossier estructurado con requisitos, alternativas, riesgos, verificación y confianza.
5. Evidencia local pendiente de revisión humana.
6. Transferencia a una pieza, arquitectura, calibre o perfil distinto.

Los contratos declarativos se encuentran en `src/learning/content/authoring.ts`. Los datos de dominio viven separados del contenido editorial y de la interfaz. El paquete integrado es `wplab.horology.manufacturing-design-validation@1.0.0`, requiere Watch Prototype Lab 0.9.0 y se genera mediante `npm run learning:capstone-generate`.

## Sistema 6 · Fabricación y acabados

Ruta: `route.capstone.manufacturing-finishing`.

### Alcance

Se han modelado siete planes de proceso:

1. Diseño para fabricar, medir y revisar.
2. Caja y arquitectura exterior.
3. Esfera, índices y superficies gráficas.
4. Agujas, cañones y holguras.
5. Platinas, puentes, apoyos y rubíes.
6. Micromecánica: ejes, piñones, tornillos y muelles.
7. Acabados y decoración funcionalmente seguros.

Cada plan declara artefactos, propósito, estados de entrada y salida, operaciones, decisiones de material, datums, tolerancias, riesgos, inspecciones, aceptación, fuentes y límite físico. El catálogo compartido contiene seis familias de riesgo y siete puntos de inspección.

### Seguridad

Los riesgos incluyen maquinaria rotativa, herramientas y viruta, fluidos de mecanizado, polvo abrasivo, calor y químicos/recubrimientos. Cada uno incorpora controles y condiciones de parada. La aplicación no da instrucciones para eludir resguardos, fichas de seguridad, formación presencial o supervisión. Completar la práctica no registra una operación física como ejecutada.

### Metrología y fabricación

La tolerancia debe justificar una función y poder inspeccionarse. Los planes mantienen juntos datum, característica, método, incertidumbre, regla de decisión y aceptación. La decoración se trata como proceso que puede retirar o añadir material, contaminar superficies o destruir datums; nunca como una capa visual inocua.

El workspace muestra la cadena de proceso, entradas, salidas, riesgos, inspecciones, datums, decisiones de tolerancia y criterios de aceptación. Se puede operar íntegramente con texto y teclado.

## Sistema 7 · Ruta de diseño propio

Ruta: `route.capstone.personal-watch-design`.

### Progresión

La ruta tiene tres niveles explícitos:

1. Reloj con movimiento adquirido.
2. Modificación arquitectónica controlada.
3. Movimiento propio.

No se salta directamente al movimiento propio. Un movimiento adquirido permite aprender integración de caja, esfera, agujas, tija, corona, pila axial, documentación y ensayo sin inventar todavía el órgano regulador o el escape. La modificación controlada exige fijar una base, una interfaz modificada, una arquitectura de referencia y pruebas que detecten regresiones. El movimiento propio añade presupuestos de energía, frecuencia, reserva, espacio, estructura, fabricación, montaje y servicio.

### Puertas de diseño

Se implementan seis puertas:

1. Pliego, usuario y arquitectura del producto.
2. Integración de un movimiento adquirido.
3. Caja, esfera, agujas y experiencia de uso.
4. Modificación arquitectónica controlada.
5. Arquitectura de un movimiento propio.
6. Dossier integral y puerta de prototipo.

Cada puerta exige entradas, interfaces, restricciones, dos o tres alternativas reales, entregables, planes de verificación, registro de decisión, riesgos abiertos, criterios de salida y condiciones de parada. La puerta no muta `WatchProject`, no declara fabricabilidad y requiere revisión humana.

### Dossier de diseño

El resultado acumulativo es un expediente con requisitos, alternativas descartadas, decisiones, interfaces, configuración, revisiones, pruebas y riesgos. Un requisito obligatorio incumplido bloquea la alternativa aunque una suma ponderada resulte alta. La configuración propuesta para prototipo debe estar congelada y cualquier cambio posterior reabre las decisiones afectadas.

## Sistema 8 · Validación

Ruta del estudiante: `route.capstone.watch-validation`.  
Ruta interna de calidad: `route.capstone.validation` (`demo: true`).

### Dos protocolos del proyecto personal

1. Revisión relojera independiente.
2. Transferencia entre calibres y arquitecturas.

### Tres protocolos internos de la Academia

1. Pruebas con principiantes.
2. Accesibilidad y equivalencia de interacción.
3. Retención diferida y puerta de liberación.

Los protocolos definen propósito, perfiles, inclusión y exclusión, tareas, casos reservados, evidencias, criterios de aceptación, hallazgos adversos, independencia y fuentes. Una conclusión positiva solo autoriza la afirmación, versión, muestra y contexto ensayados.

### Revisión relojera

El profesional comprueba exactitud, seguridad, identidad, configuración, secuencia y evidencia. Su revisión no transfiere automáticamente competencia al alumno. La ayuda sustantiva se registra y obliga a repetir una demostración independiente.

### Principiantes

Las pruebas cubren encontrar por dónde empezar, completar teoría y práctica, interpretar feedback, guardar y recuperar. Se considera fallo que una pregunta evaluada no haya sido enseñada o diagnosticada antes, que un control parezca actuar sin cambio de estado o que el lenguaje interno impida decidir.

### Transferencia

La transferencia exige al menos dos casos y reserva un caso no resuelto en el ejemplo. Se evalúa reconstruir cadenas causales, elegir evidencia y evitar copiar dimensiones, lubricación, ajuste o secuencia entre referencias.

### Accesibilidad

La matriz comprueba operación completa por teclado, foco, texto ampliado, redistribución, contraste, señales no basadas solo en color, movimiento reducido y alternativa textual equivalente. La automatización complementa la evaluación humana; no la sustituye.

### Retención

Los intervalos declarados son 1, 7 y 21 días. Releer inmediatamente antes del intento no cuenta como recuperación independiente. El protocolo combina recuperación libre, caso de transferencia y revisión de liberación.

### Regla de liberación

Los hallazgos críticos de exactitud, seguridad o accesibilidad bloquean. No se compensan mediante promedios ni por presión de calendario. La decisión final es humana y conserva objeciones, excepciones, responsable y plan de repetición.

## Fuentes y procedencia

El registro del paquete incluye 20 fuentes. Se emplean páginas oficiales de ISO, W3C, OSHA, NIOSH, NIST y fabricantes, dos estudios sobre recuperación/espaciado y el libro privado de construcción mecánica como teoría complementaria. El libro no se presenta como documentación MIYOTA y los datos de calibre se vinculan exclusivamente a la fuente aplicable.

Las normas se enlazan por su ficha oficial. Antes de una decisión física debe comprobarse edición, revisión, alcance y acceso al texto aplicable. ISO 22810:2010 e ISO 3159:2009, por ejemplo, pueden encontrarse bajo revisión sistemática; el contenido instalado no congela su vigencia futura.

## Persistencia y funcionamiento offline

Las lecciones, contratos y workspaces están integrados en el instalador. Las respuestas, sesiones, evidencias, notas, progreso y revisiones siguen la persistencia local existente. Las URLs de fuentes pueden requerir conexión, pero la teoría y la práctica no dependen de abrirlas para renderizarse. Las copias privadas no se incorporan al paquete ni se exponen como rutas del sistema.

## Pruebas

Se añadieron pruebas para:

- integridad y enlaces del catálogo de fabricación;
- cobertura de caja, esfera, agujas, platina, puentes, micromecánica y decoración;
- límites entre planificación digital y trabajo físico;
- progresión adquirida → modificación controlada → movimiento propio;
- alternativas, riesgos, verificación y parada en todas las puertas;
- participantes, accesibilidad, transferencia y retención diferida;
- 7 paquetes reales, 12 rutas del estudiante, 1 ruta interna de calidad, 85 módulos, 104 conceptos y 157 prácticas;
- contratos pedagógicos, tutor acotado y revisión humana.

La puerta de entrega es `npm run verify`, seguida por el empaquetado Tauri/NSIS y la comprobación de cabecera PE, tamaño, SHA-256 y manifiesto.

## Archivos principales

- `src/learning/manufacturing/manufacturing.ts`
- `src/learning/design/personalWatchDesign.ts`
- `src/learning/validation/academyValidation.ts`
- `src/learning/content/authoring.ts`
- `scripts/generate-watchmaking-capstone.ts`
- `learning-content/watchmaking-capstone/`
- `src/learning/product/watchmakingCapstoneContent.ts`
- `src/learning/ui/AcademySurfaces.tsx`
- `src/learning/ui/LearningSurfaces.tsx`
- `src/learning/ui/LearningActivityWorkspace.tsx`
- `src/learning/academy/watchmakerJourney.ts`

## Deuda deliberada

- La Academia no controla maquinaria, no sustituye formación práctica y no concede acreditación profesional.
- No se han creado geometrías exactas de piezas sin documentación o medición.
- No se han incorporado textos completos de normas externas.
- La firma Authenticode comercial del instalador sigue siendo una tarea de publicación, no de funcionamiento local.
- Un movimiento propio fabricado exigirá cálculos, planos, utillaje, prototipos, medidas y revisiones físicas que no pueden inferirse de un expediente digital.

## Criterios de aceptación

El conjunto se considera terminado cuando las tres rutas son visibles, la teoría precede a la práctica, los 18 contratos se cargan sin diagnósticos, los workspaces muestran datos de dominio reales, las respuestas persisten, la revisión humana sigue siendo obligatoria, las pruebas pasan y el instalador 0.9.0 se genera con hash verificable.
