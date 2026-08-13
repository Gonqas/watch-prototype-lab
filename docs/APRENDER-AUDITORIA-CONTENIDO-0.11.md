# Aprender — auditoría integral de conocimiento y contenido 0.11

Fecha: 2026-08-09  
Aplicación auditada: Watchmaking Academy 0.11.0  
Alcance: conocimiento, explicaciones, vocabulario, fuentes, amplitud, profundidad, secuencia conceptual y rigor técnico  
Fuera de alcance: interfaz, navegación, disposición visual, persistencia, accesibilidad de componentes y arquitectura de software, salvo cuando condicionan qué conocimiento existe  
Estado: auditoría y propuesta editorial; no se ha modificado código ni contenido de producción

## 1. Veredicto ejecutivo

La Academia ya tiene una base pedagógica y técnica mucho mejor que una colección de vídeos o fichas: obliga a estudiar teoría antes de practicar, conserva fuentes y límites, separa simulación educativa de validación física, registra práctica y retención y dispone de casos conceptuales y de calibres reales. Esa base debe conservarse.

Sin embargo, si el objetivo personal es avanzar desde principiante hasta comprender, mantener, diseñar y finalmente construir un reloj propio, el contenido actual todavía es un **mapa amplio con varias zonas escritas a profundidad introductoria**, no una biblioteca formativa completa. La cobertura nominal es considerable, pero la profundidad real es muy desigual.

Los principales resultados son:

1. La Academia ofrece 12 rutas visibles, 87 lecciones, 154 actividades, 104 conceptos y 14 errores conceptuales declarados. El alcance es ya sustancial para una primera versión.
2. Las lecciones visibles contienen aproximadamente 65.500 palabras. Los 90 registros de lección, incluyendo tres unidades internas de calidad que no ve el estudiante, reúnen 68.096 palabras.
3. Un detector conservador de párrafos idénticos encontró 25.607 palabras repetidas literalmente en esos bloques: **37,6 % del total**. No toda repetición es inútil, pero sí demuestra que el recuento bruto de palabras sobrestima la cantidad de conocimiento específico.
4. Las mayores concentraciones de repetición exacta están en metrología —81,0 %—, el bloque avanzado —52,4 %— y fabricación/diseño/validación —49,7 %—. En estos conjuntos se repiten marcos epistemológicos y secuencias de estudio donde debería crecer la explicación propia de cada materia.
5. Los fundamentos mecánicos son la parte con mayor densidad técnica real. Orientación es la más limpia editorialmente. MIYOTA 2035 y 8215 son buenos estudios de caso documentados, pero no deben seguir soportando por sí solos la amplitud de la formación.
6. El registro de Horology Student contiene 24 recursos curados, pero hoy funciona principalmente como **catálogo de descubrimiento**. Registrar un enlace no significa haber incorporado su conocimiento a la Academia.
7. El libro privado de George Daniels cubre trece grandes áreas. La Academia utiliza de forma explícita solo parte de seis de ellas y deja casi sin explotar taller, herramientas, acabado de metales, torneado, fabricación de componentes pequeños, cajas, esferas y guilloché.
8. El corpus VBA contiene 25 libros de cálculo, 49 problemas y áreas valiosas de energía, espirales, engranajes, tolerancias, materiales, estanqueidad, calidad y fiabilidad. La Academia solo ha convertido seis fórmulas en laboratorios y todavía no ha desarrollado la teoría que debería rodearlas.
9. Las rutas llamadas avanzadas mencionan calendarios, cronógrafos, escapes, construcción ultraplano, fabricación y acabados, pero una unidad por asunto no proporciona aún dominio teórico, cálculo, diagnóstico ni comparación suficiente.
10. La trazabilidad es desigual. Mecánica, 2035 y 8215 cuentan con varias afirmaciones declaradas, mientras que atlas avanzado, metrología y capstone carecen de trazabilidad a nivel de afirmación. En algunos casos la fuente citada no respalda la materia concreta que aparenta respaldar.

La recomendación central es **no aumentar primero el número de rutas**. Conviene transformar la amplitud nominal actual en conocimiento sustantivo, corregir las fuentes y dependencias y, después, ampliar el canon hasta unas 260–320 unidades técnicas bien delimitadas. La meta no debe ser una cifra de palabras: debe ser que cada tema pueda recorrerse desde vocabulario y causalidad hasta cálculo, diagnóstico, comparación y diseño.

## 2. Qué significa “contenido completo” en esta auditoría

Una palabra, una imagen o el nombre de un mecanismo no bastan para considerar un asunto enseñado. Se han usado cinco niveles:

| Nivel | Estado | Criterio |
|---:|---|---|
| 0 | Ausente | El asunto no aparece o solo existe en una fuente externa no integrada. |
| 1 | Mencionado | Se nombra y quizá se define, pero no se explica su mecanismo. |
| 2 | Explicado | Se describen piezas, relaciones, secuencia causal, vocabulario y límites. |
| 3 | Aplicado | Hay ejemplos resueltos, cálculos o procedimientos, errores y práctica independiente. |
| 4 | Transferible | Se compara entre arquitecturas, se diagnostican variantes y se usa para tomar decisiones de servicio o diseño. |

Un tema solo se considera sólidamente enseñado si contiene, cuando proceda:

- vocabulario preciso en español y equivalentes técnicos habituales;
- ubicación de cada pieza y relación con las demás;
- mecanismo causal: entrada, transformación, salida y pérdidas;
- condiciones de funcionamiento y de fallo;
- magnitudes, unidades, fórmulas, hipótesis y límites;
- al menos un ejemplo resuelto y otro caso no idéntico;
- errores frecuentes y cómo distinguirlos;
- fuente enlazada a la afirmación concreta;
- contraste entre modelo conceptual, documentación y calibre real;
- una prueba de transferencia, no solo reconocimiento.

Este criterio es deliberadamente más exigente que “hay una lección con ese título”. Es apropiado para la ambición declarada: llegar a crear un reloj propio desde cero.

## 3. Corpus y método revisados

La auditoría ha revisado:

- los paquetes declarativos actuales de `learning-content`;
- las 12 rutas visibles y la ruta interna de control de calidad;
- lecciones, bloques, conceptos, glosarios, errores conceptuales, actividades, fuentes y claims;
- `APRENDER-ACADEMIA-P1.md`, `APRENDER-ACADEMIA-P2.md`, la auditoría 0.7 y la documentación de ingeniería;
- el registro local de los 24 enlaces procedentes de [Horology Student](https://horology-student.org/resources/);
- el índice bibliográfico comentado de [Horology Student Books](https://horology-student.org/resources/books/);
- el PDF privado de George Daniels, *Watchmaking*, de 425 páginas;
- el archivo `VBAUhrentechnik.zip` y su auditoría técnica completa;
- programas de formación profesional como contraste de amplitud, especialmente el [programa Watchmaker de WOSTEP](https://www.wostep.ch/en/training/watchmaker-program), su [folleto curricular](https://www.wostep.ch/sites/default/files/2025-12/P05-Watchmaker_brochure_en.pdf) y los [estándares de AWCI](https://www.awci.com/wp-content/uploads/2011/07/AWCI-standards-practicese.pdf).

También se comprobó la auditoría declarativa existente:

- P1: 12 rutas, 87 lecciones, 154 actividades y 1540/1540 controles formales;
- P2: 104 conceptos, 14 errores conceptuales, 1078 controles declarativos y 9/9 garantías de runtime.

Estos resultados prueban que la estructura existe y es coherente con sus contratos. **No prueban que la materia sea completa, específica ni técnicamente suficiente.** Esta auditoría cubre precisamente esa diferencia.

## 4. Inventario editorial real

### 4.1 Volumen, especificidad y repetición

| Área | Lecciones visibles | Media aproximada por lección | Párrafos repetidos exactamente en sus bloques | Diagnóstico de contenido |
|---|---:|---:|---:|---|
| Orientación funcional | 6 | 675 palabras | 0,0 % | Buena introducción sistémica; insuficiente como base relojera total. |
| Cuarzo y MIYOTA 2035 | 10 | 741 | 21,5 % | Caso oficial útil; electrónica y diagnóstico aún básicos. |
| Fundamentos mecánicos | 12 | 1003 | 14,2 % | Núcleo actual más fuerte; todavía incompleto para ingeniería y servicio. |
| MIYOTA 8215 | 15 | 681 | 19,8 % | Buen dossier estructural R2; poca transferencia y teoría propia del calibre. |
| Inspección y metrología | 14 | 684 | 81,0 % | Cobertura nominal amplia, profundidad específica muy inferior a lo que sugiere el volumen. |
| Atlas, servicio y arquitecturas avanzadas | 15 | 648 | 52,4 % | Índice razonable de temas; desarrollo técnico demasiado breve. |
| Fabricación, diseño y validación | 15 | 831 | 49,7 %* | Buen marco de proyecto; no constituye todavía formación de fabricación. |

\* La medición de repetición de este paquete incluye además tres unidades internas de QA, excluidas de las 87 lecciones visibles.

La repetición detectada es un mínimo: solo cuenta párrafos literalmente idénticos de longitud significativa. No detecta reformulaciones casi iguales ni estructuras vacías con nombres distintos. Parte de la repetición es razonable —procedencia, prudencia, restauración—, pero no debería ocupar la mitad o más de cada unidad.

### 4.2 Vocabulario, errores y dependencias

| Paquete | Entradas de glosario | Conceptos que referencian algún error | Errores únicos del paquete | Observación |
|---|---:|---:|---:|---|
| Avanzado | 0 | 0 | 0 | Usa terminología especialista sin una red léxica propia. |
| Orientación | 36 | 7 | 5 | Buen punto de partida. |
| Metrología | 24 | 0 | 0 | Define términos, pero no modela confusiones habituales. |
| Mecánica | 48 | 7 | 3 | Mejor red conceptual, aunque varios conceptos complejos son demasiado amplios. |
| MIYOTA 8215 | 56 | 7 | 3 | Buena identidad nominal; los 20 conceptos carecen de prerrequisitos internos declarados. |
| Cuarzo/2035 | 15 | 6 | 3 | Vocabulario insuficiente para electricidad y electrónica. |
| Capstone | 0 | 0 | 0 | Habla de fabricación, diseño y validación sin glosario técnico propio. |

Solo hay 14 errores conceptuales únicos para 104 conceptos; algunos se reutilizan desde varios conceptos. La ausencia es total en metrología, avanzado y capstone, y el inventario de los calibres es todavía muy pequeño. Es una carencia importante porque los errores plausibles forman parte esencial del conocimiento: confundir precisión con exactitud, holgura con desgaste, amplitud con marcha, fuerza con par, aislamiento con diagnóstico, impermeable con resistente al agua, pulido con corrección geométrica, o un dato de catálogo con una medida del ejemplar.

Además, “104 conceptos” sobrestima la granularidad conceptual. Varias entradas son competencias completas —por ejemplo, explicar un barrilete o documentar una fabricación— y no ideas atómicas con dependencias comprobables. Un buen grafo necesitará varios centenares de nodos pequeños.

## 5. Hallazgos prioritarios

### P0-C1 — La profundidad aparente está inflada por texto reutilizado

**Evidencia:** 25.607 de 68.096 palabras pertenecen a párrafos repetidos exactamente; metrología alcanza 81 %. Los textos repetidos explican con frecuencia cómo estudiar, cómo distinguir fuente de inferencia y cómo cerrar una sesión, no el fenómeno específico del título.

**Consecuencia:** dos lecciones de materias distintas pueden cumplir el mínimo de 600 palabras sin aportar 600 palabras de conocimiento diferente. El estudiante invierte tiempo, pero el conocimiento marginal es bajo.

**Recomendación:** reescribir primero las 44 unidades visibles de avanzado, metrología y capstone. Conservar la política común en un bloque transversal corto y dedicar al menos 80 % de cada unidad a materia específica.

### P0-C2 — La procedencia no llega de forma consistente a la afirmación

**Evidencia:** mecánica, 2035 y 8215 contienen registros de claims, pero avanzado, metrología y capstone no. Es posible saber qué fuentes declara una lección, pero no qué fuente respalda cada dato, fórmula, secuencia o recomendación.

**Consecuencia:** una lista de fuentes correcta puede dar apariencia de respaldo a afirmaciones que esa fuente no contiene.

**Recomendación:** toda afirmación verificable debe tener alcance y procedencia: definición, fórmula, dato, procedimiento, observación, inferencia, reconstrucción o recomendación educativa. Los párrafos puramente pedagógicos no necesitan citas técnicas; los datos sí.

### P0-C3 — Existen citas decorativas o desalineadas

**Ejemplos:**

- las 14 lecciones de metrología reutilizan esencialmente BIPM VIM, GUM, NIST y una fuente original, incluso en iluminación, postura, fotografía o daños, asuntos que requieren bibliografía específica;
- WCAG aparece cerca de fabricación de esferas y agujas: puede respaldar accesibilidad digital o contraste perceptivo en interfaz, pero no técnicas de fabricación física;
- páginas de catálogo de normas ISO se usan como si contuvieran el detalle normativo, cuando a menudo solo permiten confirmar título, alcance y edición;
- una fuente original de la propia Academia respalda afirmaciones que deberían derivarse de documentación técnica externa.

**Recomendación:** incorporar una auditoría semántica `afirmación → fuente → localización → alcance`. Una fuente debe poder fallar el control aunque su ID sea válido.

### P0-C4 — Las rutas avanzadas son catálogos, no aún cursos avanzados

Una unidad de calendarios, una de cronógrafos, una de escapes comparados o una de ultraplano permite orientación, pero no cubre arquitectura, secuencia, cálculos, ajustes, defectos, variantes y casos. El nombre de la ruta crea una expectativa superior al conocimiento que entrega.

**Recomendación:** tratar las unidades actuales como “mapas de entrada” y convertir cada tema avanzado en una familia de 6–15 unidades.

### P0-C5 — El conocimiento de fabricación es todavía declarativo

El capstone habla correctamente de requisitos, datums, verificaciones, seguridad y trazabilidad, pero no enseña aún con suficiente detalle materiales, geometría de herramienta, operaciones, secuencias, metrología de proceso, defectos, tratamientos, fijación, acabado y corrección.

**Recomendación:** no interpretar “fabricación implementada” como “fabricación enseñada”. Separar teoría de proceso, cálculo, observación de ejemplos, práctica virtual y destreza manual validada.

### P0-C6 — Los laboratorios de ingeniería no poseen un curso que los sostenga

Existen seis estaciones valiosas: tren compuesto, oscilador torsional, muelle rectangular, cadenas de tolerancia, capacidad de proceso y Weibull. Cada estación tiene una frase conceptual, una pregunta y una pauta general. Esto es una calculadora con buen contrato, no un itinerario de ingeniería.

**Recomendación:** crear antes de cada laboratorio una secuencia de magnitudes, derivación, hipótesis, análisis dimensional, ejemplo manual, sensibilidad, incertidumbre y aplicación relojera. Integrar progresivamente el corpus VBA solo después de rederivar y verificar sus fórmulas.

### P1-C1 — MIYOTA es un buen caso, pero concentra demasiado el conocimiento aplicado

Veinticinco de las 87 lecciones visibles pertenecen a 2035 o 8215. Es correcto conservarlas: ofrecen documentación oficial y un objeto concreto. El problema no es MIYOTA, sino la escasez de casos comparativos de ETA, Sellita, Seiko, Citizen, calibres históricos y arquitecturas no suizas.

**Recomendación:** mantener 2035 y 8215 como primeros casos patrón y exigir transferencia posterior a, como mínimo, una arquitectura diferente y un calibre de otra familia.

### P1-C2 — El grafo de prerrequisitos no representa la dependencia real

Los 20 conceptos de MIYOTA 8215 carecen de prerrequisitos internos. Otras entradas agrupan demasiados conocimientos bajo un único nodo. Un alumno puede llegar declarativamente a calendario, automático o servicio sin que el grafo exija tren, apoyos, escape, oscilador y control de energía.

**Recomendación:** atomizar conceptos y construir dependencias causales. La ruta visual puede conservarse; lo que debe cambiar es el modelo editorial del conocimiento.

### P1-C3 — Faltan errores conceptuales donde más enseñan

Los errores no deben limitarse a opciones falsas de un cuestionario. Deben constituir una biblioteca de modelos mentales incorrectos, con evidencia de reparación y variaciones entre calibres.

**Recomendación:** pasar de 14 a 100–150 errores bien documentados durante la expansión, priorizando energía, engrane, escape, oscilador, lubricación, medición, diagnóstico, estanqueidad y fabricación.

### P1-C4 — El glosario no cubre la lengua real del oficio

Faltan familias terminológicas en avanzado y capstone y no hay política sistemática de equivalencias español–inglés–francés–alemán. La documentación relojera real usa las cuatro lenguas y variantes históricas.

**Recomendación:** crear un léxico canónico de 500–800 términos con sinónimos, falsos amigos, pieza/subconjunto, definición funcional, imagen, calibres de ejemplo y relaciones. No convertir el glosario en sustituto de la teoría.

### P1-C5 — La historia técnica casi no explica por qué existen las arquitecturas

La evolución desde reloj portátil, cilindro, áncora, cuerda por llave y por tija, automático, cuarzo, antichoque, espirales y producción industrial ayuda a entender por qué una solución aparece y qué problema resuelve. Hoy aparece de forma dispersa.

**Recomendación:** una historia técnica transversal, centrada en problemas y soluciones, no en marcas ni marketing.

## 6. Auditoría por área actual

### 6.1 Orientación funcional relojera

**Lo que ya enseña bien**

- el reloj como sistema y no como suma de ruedas;
- cadenas funcionales de cuarzo y mecánica;
- funciones universales: energía, regulación/control, transmisión, indicación y estructura;
- comparación sin confundir el modelo conceptual con un calibre real;
- predicción inicial de interrupciones.

**Lo que falta**

- vocabulario de orientación física: lado esfera, lado puentes, 12/3/6/9, altura, diámetro, eje y plano;
- tipos de relojes y movimientos;
- lectura de una ficha técnica, un plano y una vista explosionada;
- unidades y órdenes de magnitud;
- diferencia entre pieza, órgano, subconjunto, función e interfaz;
- nociones de seguridad, energía almacenada, pila y manipulación;
- historia mínima de las soluciones;
- más ejemplos antes de pedir clasificación o diagnóstico.

**Nivel actual:** 2 en visión sistémica; 1 en cultura técnica de entrada.

### 6.2 Cuarzo conceptual y MIYOTA 2035

**Fortalezas**

- separación entre cadena conceptual y calibre 2035;
- documentación oficial, identidad, desmontaje, montaje y observación;
- prudencia sobre geometría y medidas no publicadas;
- primer banco y flujo de documentación.

**Lagunas de teoría de cuarzo**

- pila: química básica, tensión, capacidad, resistencia interna, fuga y seguridad;
- cristal de cuarzo: piezoelectricidad, frecuencia, deriva térmica y envejecimiento;
- oscilador, divisor de frecuencia, circuito integrado y consumo;
- bobina, campo magnético, estator y rotor paso a paso;
- tren, par disponible, salto y carga de agujas;
- medida de continuidad, aislamiento, consumo e impulsos;
- diagnóstico entre fallo eléctrico, mecánico y de contacto;
- EOL, inhibición, termocompensación y tecnologías de alta precisión;
- variantes solares, cinéticas, radio-controladas y conectadas, como ramas posteriores;
- comparación con más de un movimiento analógico de cuarzo.

**Nivel actual:** 2 para arquitectura 2035; 1–2 para electrónica y diagnóstico; 0–1 para familias de cuarzo.

### 6.3 Fundamentos mecánicos

**Fortalezas**

- cadena energética completa;
- muelle y barrilete;
- relaciones ideales de engranajes y sentido de giro;
- tren, pivotes, rubíes y puentes;
- escape suizo, volante y espiral;
- minutería, puesta en hora, automático y calendario básico;
- varias explicaciones y problemas más extensos que en otros paquetes.

**Lagunas**

- trabajo, energía, fuerza, par, potencia, eficiencia y curva de par;
- geometría de diente cicloidal, módulo, paso, addendum, depthing, backlash e interferencia;
- pérdidas, cargas, inercia, presión de contacto y desgaste;
- dimensionado real de trenes y selección de conteos;
- geometría del escape, ángulos, caída, draw, lock, impulse y seguridad;
- teoría de osciladores más allá de la fórmula ideal;
- amplitud, beat error, posiciones, isocronismo, temperatura y magnetismo;
- espirales planas/Breguet, curvas terminales y ajuste dinámico;
- tribología y lubricación por contacto;
- automáticos reversores, trinquetes, eficiencia y protección de sobrecarga;
- calendario instantáneo, semi-instantáneo, lento y zonas de corrección;
- ejercicios completos de síntesis con datos distintos.

**Nivel actual:** 2 sólido en cadena básica; 1–2 en ingeniería; 0–1 en ajuste y diseño.

### 6.4 MIYOTA 8215

**Fortalezas**

- ensamblaje canónico único;
- identidad de piezas, subsistemas, tornillos y relaciones;
- orden estructural de desmontaje y montaje;
- documentación de reconstrucción y límites R2/G/K/P;
- buen caso de estudio para un automático básico con fecha.

**Lagunas**

- teoría específica de cada interfaz apoyada en manual y observación;
- liberación segura de energía y riesgos de manipulación;
- motion works e indicación con mayor detalle;
- arquitectura del automático y comportamiento de carga;
- calendario, zona de peligro y sincronización;
- lubricación declarada por punto y autoridad cuando exista;
- juego axial/lateral, inspección y criterios de rechazo;
- cronocomparador, regulación básica, posiciones y límites oficiales;
- fallos característicos, síntomas y árbol de hipótesis;
- comparación con otros 82xx, 9015/9039 y arquitecturas ETA/Seiko;
- prerrequisitos internos para sus 20 conceptos.

**Nivel actual:** 2 estructural; 1–2 funcional; 0–1 diagnóstico y transferencia.

### 6.5 Inspección y metrología

**Fortalezas**

- diferencia entre observación, medida, estimación y dato oficial;
- unidades, exactitud, precisión e incertidumbre;
- instrumentos, fotografía y puente entre objeto físico y modelo;
- intención correcta de no convertir una foto en dimensión oficial.

**Lagunas y problemas**

- el 81 % de repetición exacta impide que cada asunto tenga suficiente desarrollo propio;
- las fuentes generales de metrología no cubren por sí solas iluminación, ergonomía, fotografía o daño relojero;
- faltan resolución, sesgo, linealidad, repetibilidad, reproducibilidad, trazabilidad y deriva aplicados;
- faltan presupuestos de incertidumbre completos y propagación;
- faltan selección de instrumento, presión de contacto, alineación, Abbe y temperatura;
- faltan comparadores, microscopía, perfilometría y metrología de marcha;
- faltan superficies, redondez, coaxialidad, batido, planitud y acabado;
- faltan estudios MSA y decisiones de conformidad;
- faltan casos con mediciones contradictorias y datos reales;
- no existen errores conceptuales declarados.

**Nivel actual:** 2 en epistemología de medida; 1 en metrología aplicada; 0–1 en MSA y geometría.

### 6.6 Atlas, servicio y arquitecturas avanzadas

**Fortalezas**

- buena disciplina para comparar fuentes y familias;
- asuntos correctamente elegidos: segundero, automático, puentes, altura, desmontaje, limpieza, lubricación, montaje, diagnóstico, escapes, ultraplano, calendarios y cronógrafos;
- casos de ETA, Seiko y MIYOTA que permiten salir del monocalibre.

**Lagunas**

- cada tema recibe demasiado poco espacio específico;
- el 52,4 % de repetición exacta convierte varias unidades en fichas epistemológicas;
- no hay glosario ni errores conceptuales;
- servicio no desarrolla química de limpieza, compatibilidad de materiales, lubricantes, contaminación, cantidades ni control final;
- el cronógrafo no cubre suficiente transmisión horizontal/vertical, leva/rueda de pilares, embrague, martillos, corazones, contadores y defectos;
- calendarios no cubre variedades, saltos, corrección, programación anual/perpetua y fallos;
- escapes comparados no cubre geometría ni comportamiento de detent, coaxial y otros;
- ultraplano se queda en restricciones generales sin cadenas de tolerancia ni casos.

**Nivel actual:** 1–2; funciona como índice de especialidades.

### 6.7 Fabricación, acabados y diseño propio

**Fortalezas**

- buen marco de requisitos, alternativas, riesgos, evidencia y revisión;
- separación entre movimiento adquirido, modificación y movimiento propio;
- datums, DFM, control de cambios y validación;
- honestidad sobre destreza manual no demostrada.

**Lagunas**

- materiales relojeros, estados metalúrgicos, tratamientos térmicos y corrosión;
- preparación y mantenimiento de herramientas;
- torneado, fresado, taladrado, escariado, roscado, brochado, corte y remachado;
- fabricación de ejes, pivotes, piñones, tornillos, muelles, palancas y agujas;
- engastado y ajuste de rubíes;
- tolerancias, datums, rugosidad, rebabas y secuencia de inspección con ejemplos;
- caja: carrura, fondo, bisel, asas, corona, tubo, cristal, juntas y estanqueidad;
- esfera: sustratos, pies, acabados, impresión, índices, lume y envejecimiento;
- agujas: geometría, equilibrado, ajuste, alturas, colisiones y legibilidad física;
- decoración: anglage, pulido negro, perlage, côtes, satinado, granallado, guilloché y control del acabado;
- costes, procesos, proveedores, BOM, AMFE, validación y fabricación iterativa;
- ejercicios de diseño real con cálculos y planos.

**Nivel actual:** 1–2 en método de proyecto; 0–1 en saber técnico de fabricación.

### 6.8 Validación

La distinción actual entre revisión relojera, pruebas con principiantes, accesibilidad, transferencia y retención es correcta. No obstante, la validación del **contenido técnico** requiere además:

- revisión por dominio y no solo revisión general;
- resolución independiente de cálculos;
- contraste con al menos dos fuentes cuando no existe fuente primaria;
- prueba contra un calibre o ejemplar real;
- registro de erratas y cambios de edición;
- separación entre validez del modelo, utilidad pedagógica y ejecución manual.

**Nivel actual:** 2 en política; 0–1 en evidencia externa acumulada.

## 7. Matriz global de cobertura

La siguiente tabla valora el conocimiento realmente desarrollado, no la mera presencia de títulos.

| Dominio | Nivel actual | Objetivo | Juicio |
|---|---:|---:|---|
| Reloj como sistema | 2–3 | 4 | Base buena; necesita más transferencia. |
| Terminología y orientación de piezas | 2 | 4 | Amplia en MIYOTA, fragmentaria fuera de él. |
| Historia técnica de la medición del tiempo | 0–1 | 3 | Prácticamente ausente. |
| Taller, orden, seguridad y ergonomía | 1 | 3 | Mencionado, no curso completo. |
| Herramientas, preparación y mantenimiento | 1 | 4 | Gran laguna frente a Daniels/WOSTEP. |
| Materiales y metalurgia | 0–1 | 4 | Insuficiente para fabricar o restaurar. |
| Energía, fuerza, par y potencia | 1–2 | 4 | Causalidad básica; falta cuantificación real. |
| Muelle real y barrilete | 2 | 4 | Falta curva, ocupación, brida, fatiga y diseño. |
| Engranajes y trenes | 2 | 4 | Relación ideal sí; geometría y contacto no. |
| Pivotes, cojinetes y rubíes | 1–2 | 4 | Función sí; fabricación, ajuste y tribología no. |
| Lubricación y tribología | 1 | 4 | Una de las lagunas más importantes. |
| Escape suizo | 2 | 4 | Secuencia funcional; falta geometría y ajuste. |
| Otros escapes | 1 | 3–4 | Comparación breve, sin desarrollo. |
| Volante, espiral y oscilación | 2 | 4 | Modelo ideal; falta ajuste y perturbaciones. |
| Cronometría y cronocomparador | 0–1 | 4 | Muy por debajo de la meta. |
| Minutería e indicación | 2 | 4 | Falta diseño, fricción, alturas y defectos. |
| Cuerda y puesta en hora | 2 | 4 | Falta variedad arquitectónica y servicio. |
| Automático | 1–2 | 4 | Concepto y 8215; falta comparación profunda. |
| Calendario simple | 1–2 | 4 | Presencia básica. |
| Calendarios complejos | 1 | 3–4 | Solo orientación. |
| Cronógrafos | 1 | 4 | Solo entrada comparativa. |
| Repetición y sonería | 0 | 3 | Ausente. |
| Otras complicaciones | 0–1 | 3 | Cobertura casi nula. |
| Cuarzo analógico | 2 | 4 | Buen 2035; electrónica insuficiente. |
| Electrónica y diagnóstico eléctrico | 1 | 4 | Falta curso propio. |
| Electromecánicos e históricos | 0 | 3 | Ausente. |
| Servicio completo | 1–2 | 4 | Método general, poca especificidad. |
| Limpieza | 1 | 4 | Faltan procesos, química y controles. |
| Diagnóstico causal | 1–2 | 4 | Árboles y casos reales insuficientes. |
| Estanqueidad y exteriores | 0–1 | 4 | Muy insuficiente. |
| Metrología dimensional | 1–2 | 4 | Buen marco, mala profundidad específica. |
| Metrología de marcha | 0–1 | 4 | Ausente como sistema. |
| Estadística, MSA y calidad | 1 | 3–4 | Tres laboratorios iniciales, sin curso. |
| Fiabilidad y FMEA | 1 | 3–4 | Weibull inicial; falta integración. |
| Torneado y micromecánica | 0–1 | 4 | Gran laguna. |
| Fabricación de piezas pequeñas | 0–1 | 4 | Gran laguna. |
| Cajas, cristales, coronas y juntas | 0–1 | 4 | Marco de diseño, no teoría práctica. |
| Esferas y agujas | 0–1 | 3–4 | Marco superficial. |
| Acabados y decoración | 0–1 | 3–4 | Lista de procesos, no conocimiento operativo. |
| CAD, tolerancias y GD&T | 1–2 | 4 | Semilla útil; faltan casos y cálculo. |
| Arquitectura de movimiento | 1–2 | 4 | Daniels parcialmente aprovechado. |
| Diseño de reloj completo | 1–2 | 4 | Buen proceso; contenido técnico insuficiente. |
| Restauración y conservación | 0–1 | 3 | Ausente como disciplina. |
| Comparación entre familias y calibres | 1–2 | 4 | Atlas pequeño; necesita decenas de casos. |

## 8. El libro privado de George Daniels

El PDF corresponde a *Watchmaking* de George Daniels y contiene 425 páginas. Es una fuente de enorme valor para construcción mecánica tradicional, pero no es un manual MIYOTA ni una introducción ligera. Debe usarse como fuente técnica histórica y práctica, contrastando seguridad, materiales y procesos con referencias actuales.

| Capítulo del libro | Presencia actual | Uso recomendado |
|---|---|---|
| 1. Workshop and Equipment | Muy baja | Banco, torno, máquinas, organización, elección y mantenimiento de equipo. |
| 2. Hand Tools | Muy baja | Buriles, limas, brocas, escariadores, abrasivos, sujeción, afilado y control. |
| 3. Finishing Steel and Brass | Casi ausente | Preparación, pulido, azulado, endurecimiento/revenido, acabados y defectos. |
| 4. Turning | Casi ausente | Principios de torno, entre puntos, pivotes, ejes, staffs, concentricidad y acabado. |
| 5. Wheels and Pinions | Parcial | Perfiles, cálculo, trazado, corte, piñones, depthing, inspección y problemas. |
| 6. Making Small Components | Casi ausente | Tornillos, muelles, piezas de acero, agujas y métodos de fabricación. |
| 7. Jewelling | Parcial | Tipos, asientos, ajuste, endshake, cap jewels, lubricación y reparación. |
| 8. Escapements | Parcial | Familias, geometría, construcción, seguridad, ajuste y comparación. |
| 9. Mainsprings and Accessories | Parcial | Dimensionado, bridas, mecanismos de cuerda, transmisión y reserva. |
| 10. Movement Design | Parcial | Layout, tren, placas, puentes, altura, decisiones arquitectónicas y prototipo. |
| 11. Balance and Spring | Parcial | Diseño, fabricación, poising, espirales, terminales, ajuste e isocronismo. |
| 12. Casemaking | Casi ausente | Diseño y construcción de caja, ajustes, bisagras, fondo, bisel y controles. |
| 13. Engine-Turned Cases and Dials | Ausente | Guilloché, máquinas, patrones, preparación y acabado de esferas/cajas. |

### Decisión recomendada para el libro

1. Crear un índice de afirmaciones y figuras por capítulo, no copiar capítulos enteros.
2. Convertir cada procedimiento en una secuencia moderna: objetivo, herramientas, riesgos, preparación, operación, medidas, defectos y aceptación.
3. Añadir advertencia de época cuando aparezcan sustancias, hábitos o procesos que hoy requieren otra política de seguridad.
4. Usarlo como columna vertebral de micromecánica y construcción, combinado con teoría más didáctica y fuentes actuales.
5. Mantener totalmente separada su autoridad de la documentación oficial de un calibre real.

## 9. El corpus VBA Uhrentechnik

La auditoría previa verificó un corpus de:

- 2 manuales PDF;
- 25 libros Excel;
- 60 hojas;
- 12.222 celdas no vacías;
- 7.252 fórmulas;
- 57 funciones;
- 49 problemas;
- 2.265 líneas de VBA.

Sus áreas de mayor valor formativo son:

- energía, trabajo, momento de inercia y balances;
- muelle real, barrilete y normalización;
- espiral, curva terminal e isocronismo;
- estándares de engranajes y contacto de Hertz;
- tolerancias, ajustes e ISO;
- micro-muelles;
- juntas tóricas, cristales y deformación;
- rotor automático, centro de masa e inercia;
- capacidad de proceso, FMEA y fiabilidad Weibull.

El contenido no debe importarse como verdad ejecutable. La auditoría encontró factores de escala dudosos, signos problemáticos en Weibull y ambigüedades de normalización. Es un excelente **banco de problemas y modelos a rederivar**, no una autoridad infalible.

### Decisión recomendada para VBA

Convertirlo en cuatro cursos progresivos:

1. **Matemáticas y física para relojería:** unidades, dimensiones, vectores, proporciones, energía, par, inercia y oscilación.
2. **Ingeniería de órganos:** muelle, tren, escape, espiral, rotor, apoyos y contacto.
3. **Fabricación y metrología:** tolerancias, ajustes, cadenas, superficies y capacidad.
4. **Diseño y fiabilidad:** FMEA, Weibull, requisitos, sensibilidad, incertidumbre y verificación.

Cada hoja debe pasar por: rederivación independiente, análisis dimensional, ensayo de límites, ejemplo reproducible, contraste con otra fuente y versionado. Solo después puede convertirse en fórmula de la herramienta.

## 10. Los 24 recursos de Horology Student

El índice de Horology Student es útil porque reúne clases de fuente distintas. La Academia ya conserva los 24 enlaces, pero debe asignar a cada uno una función editorial explícita.

| Recurso | Valor real para la Academia | Integración recomendada | Límite de autoridad |
|---|---|---|---|
| Horology Student · Books | Descubrir bibliografía por nivel y tema. | Lista de lectura y mapa de carencias. | Reseña personal; no respalda datos técnicos. |
| Horology Student · Shops | Descubrir herramientas, movimientos y proveedores. | Futura preparación de prácticas físicas. | No es recomendación de compra ni especificación. |
| WatchBase | Familias, calibres base y relojes que los usan. | Atlas comparativo y ejercicios de identificación. | Contrastar siempre con fabricante. |
| Ranfft | Base histórica de calibres y especificaciones. | Identificación, familias y comparación histórica. | Fuente secundaria; puede contener omisiones o convenciones propias. |
| Caliber Corner | Fichas y fotografías accesibles. | Orientación y comparación preliminar. | No sustituye manual o ficha oficial. |
| Pocket Watch Database | Numeración, fabricantes y relojes de bolsillo. | Historia industrial e identificación americana. | Alcance especializado; verificar casos. |
| Ciechanowski · Mechanical Watch | Explicación causal interactiva muy completa. | Guion de fundamentos: energía → tren → escape → oscilador → montaje → cuerda → indicación. | Modelo didáctico secundario, no manual de servicio. |
| Animagraffs · Mechanical Watch | Modelo 3D animado de interacciones. | Contraste visual y reconstrucción mental espacial. | Ilustración educativa; no fuente dimensional. |
| TimeZone Illustrated Glossary | Nombres, piezas y funcionamiento básico. | Léxico ilustrado y pruebas de identificación. | Secundaria y antigua; verificar terminología. |
| TimeZone · Horologium | Artículos técnicos y análisis de movimientos. | Seminarios de caso: automáticos, calendarios, escapes, ajustes y arquitectura. | Calidad variable por artículo; el archivo puede tener problemas de acceso. |
| Hodinkee · Watch 101 | Taxonomía amplia de mecánica, complicaciones, acabados y fabricación. | Índice de cobertura y glosario de entrada. | Divulgación; no usar para tolerancias o procedimientos. |
| ETA Swisslab 6497 | Secuencias visuales de montaje/desmontaje. | Caso de servicio ETA 6497 y comparación con 8215. | Herramienta web antigua; confirmar procedimiento con documentación vigente. |
| Horlogerie Suisse | Teoría y desmontajes en francés. | Terminología francesa, teoría y casos. | Disponibilidad irregular; contrastar afirmaciones. |
| Learn Watchmaking | Cursos online y visión de progresión práctica. | Benchmark de secuencia y material complementario. | No convertir una descripción comercial en fuente técnica. |
| Jomashop · History | Línea temporal divulgativa. | Descubrir hitos para una ruta de historia técnica. | Fuente comercial secundaria; verificar cada hito. |
| The Naked Watchmaker | Deconstrucciones, fabricación e imágenes de alta calidad. | Estudios de caso visuales y entrevistas de oficio. | Observación editorial; separar foto, inferencia y dato oficial. |
| Watch Guy · Repair Blog | Casos reales de servicio con fotografías. | Árboles de diagnóstico y diarios de reparación. | Un caso no establece una regla universal; acceso restringido en ocasiones. |
| 17jewels.info | Archivo de 1.397 movimientos de 192 fabricantes y 1.128 artículos propios en la consulta de 2026-08-09. | Atlas multimarca, tipologías, variantes históricas y transferencia. | Observación de ejemplares y fuente secundaria; verificar especificaciones. |
| Ashton Tracy | Perspectiva de relojero independiente. | Oficio, fabricación, restauración y decisiones de proyecto. | Disponibilidad actual problemática; verificar materiales antes de integrar. |
| Dean DK | Proyecto documentado de construcción tradicional. | Diario completo de fabricación y reflexión de proceso. | Vídeo de proyecto, no norma técnica. |
| Nathan Bobinchak | Experiencia de escuela y ejercicios técnicos. | Casos de formación, herramientas, perfiles, estanqueidad y reparación. | Experiencia individual; contrastar procedimientos. |
| Worn & Wound · Caliber Spec | Comparaciones de 2824, rivales y clones. | Lecturas de arquitectura y familias. | Divulgación especializada; contrastar fichas. |
| Watch Guy · Service Manuals | Manuales e instrucciones técnicas. | Prioridad alta para casos de calibres concretos. | La autoridad pertenece al manual/fabricante y a su revisión, no al sitio agregador. |
| watch-movements.eu | Artículos, movimientos interesantes y conocimientos básicos. | Casos históricos, deconstrucciones y traducción técnica alemana. | Secundaria; revisar traducción y procedencia. |

### Conclusión sobre estos recursos

La colección es muy útil, pero cumple cuatro funciones diferentes que no deben mezclarse:

1. **Fuentes primarias:** manuales y documentación del fabricante encontrados a través de los agregadores.
2. **Explicación secundaria:** Ciechanowski, Animagraffs, TimeZone, Hodinkee y Horlogerie Suisse.
3. **Evidencia de ejemplar y casos:** 17jewels, Naked Watchmaker, Watch Guy, Bobinchak y Dean DK.
4. **Descubrimiento e índice:** bases de datos, bibliografía, tiendas y taxonomías.

La Academia debe enseñar con todas ellas, pero nunca darles la misma autoridad.

## 11. Contraste con una formación relojera amplia

El programa WOSTEP Watchmaker I+II+III declara unas 3.200 horas en 22 meses. Sus temas incluyen historia, taller, herramientas, micromecánica, mantenimiento de herramientas, movimientos mecánicos y electrónicos, análisis, servicio, complicaciones, escape, órgano regulador, cronógrafo, cronometría, materiales, torneado, fresado, acabado de alta gama, fabricación de componentes, montaje, control COSC y pulido.

AWCI distingue explícitamente conocimiento, destreza y disposiciones profesionales. Sus estándares abarcan producto, cajas, cristales, brazaletes, estanqueidad, cuarzo, servicio, herramientas, diagnóstico, fabricación básica de componentes, ajuste y control final.

La Academia personal no necesita imitar el número de horas ni atribuir una certificación. Sí debería cubrir el **mapa teórico completo** y dejar claro qué parte necesita banco real, herramientas, supervisión y evaluación humana.

Frente a esos referentes, las carencias más grandes no son MIYOTA ni el 3D. Son:

1. herramientas y micromecánica;
2. materiales y tratamientos;
3. servicio, limpieza y lubricación;
4. cronometría y ajuste;
5. exteriores y estanqueidad;
6. fabricación real de componentes;
7. complicaciones;
8. conocimiento histórico y multimarca;
9. ejercicios técnicos suficientes;
10. revisión experta de afirmaciones y resultados.

## 12. Canon completo recomendado

La estructura actual puede mantenerse. La propuesta es ampliar y profundizar el contenido mediante doce dominios editoriales, con unas 260–320 unidades enfocadas. La cifra es una guía de alcance, no un KPI de calidad.

### Dominio A — Cultura relojera, lenguaje e historia técnica — 16–20 unidades

- medir el tiempo y tipos de oscilador;
- reloj, movimiento, calibre, complicación y órgano;
- vistas, ejes, lados, líneas y tamaños;
- historia desde fuerza motriz y escape hasta cuarzo;
- evolución de cuerda, puesta en hora, antichoque y automático;
- industrialización, ébauches y familias;
- lectura de especificaciones, planos, patentes y manuales;
- glosario multilingüe inicial.

### Dominio B — Taller, herramientas, seguridad y materiales — 18–24 unidades

- banco, postura, limpieza y control de contaminación;
- lupas, pinzas, destornilladores y soportes;
- afilado, preparación y mantenimiento;
- tornos, fresas, taladros, escariadores y útiles;
- acero, latón, alpaca, bronce, rubí, cerámica y polímeros;
- dureza, elasticidad, tenacidad, corrosión y magnetismo;
- tratamientos térmicos y superficiales;
- adhesivos, disolventes, pilas y seguridad química/mecánica.

### Dominio C — Matemáticas, física, metrología y calidad — 22–30 unidades

- unidades y análisis dimensional;
- razón, proporción, trigonometría y geometría;
- fuerza, par, energía, potencia, fricción e inercia;
- oscilación, frecuencia, periodo y amortiguamiento;
- medición, incertidumbre y trazabilidad;
- resolución, exactitud, repetibilidad y reproducibilidad;
- tolerancias, ajustes y cadenas;
- superficies y geometría;
- MSA, capacidad, FMEA y fiabilidad.

### Dominio D — Movimiento mecánico fundamental — 34–42 unidades

- muelle, barrilete, trinquete y transmisión de energía;
- ruedas, piñones, perfiles, trenes y conteos;
- placas, puentes, tornillos, pivotes y rubíes;
- escape suizo completo;
- volante, espiral, antichoque y regulación;
- minutería, indicación, cuerda y puesta en hora;
- automático, fecha y arquitecturas básicas;
- integración, pérdidas y síntomas.

### Dominio E — Cronometría, escape y órgano regulador — 24–32 unidades

- geometría y fases del escape;
- lock, draw, drop, impulse y seguridad;
- amplitud, beat error y marcha;
- posiciones, temperatura, magnetismo y reserva;
- isocronismo, poising, collet, stud y pitones;
- espirales planas y terminales;
- cronocomparador y lectura de trazas;
- ajuste progresivo y límites de intervención;
- escapes detent, coaxial, cilindro, pin lever y otros.

### Dominio F — Cuarzo, eléctrico y electromecánico — 18–24 unidades

- electricidad básica y seguridad;
- pila y consumo;
- cuarzo, oscilador y divisor;
- bobina, estator, rotor y tren;
- instrumentos y diagnóstico;
- 2035 como caso patrón;
- otros calibres analógicos;
- electromech, diapasón, LED/LCD, solar, kinetic, radio y HAQ.

### Dominio G — Servicio, lubricación y diagnóstico — 28–36 unidades

- recepción y línea base;
- documentación, fotografía y organización;
- liberación de energía;
- desmontaje, conservación de identidad y control;
- limpieza por material y contaminación;
- tribología, tipos y cantidades de lubricante;
- inspección, juegos, desgaste y deformación;
- montaje, comprobaciones parciales y control final;
- árboles de síntomas y fallos inducidos;
- servicio comparado de 8215, 6497, 2824/SW200 y Seiko.

### Dominio H — Exteriores, caja y estanqueidad — 16–22 unidades

- arquitectura de caja;
- corona, tubo, pulsadores, fondo y bisel;
- cristales y métodos de fijación;
- juntas, compresión, envejecimiento y lubricación;
- brazaletes, cierres, pasadores y asas;
- presión seca/húmeda, condensación y diagnóstico;
- materiales, acabados y restauración responsable.

### Dominio I — Micromecánica y fabricación — 28–38 unidades

- medición, trazado, sujeción y secuencia;
- torneado entre puntos y en mandril;
- pivotes, ejes y staffs;
- ruedas, piñones y corte;
- tornillos, muelles, palancas y piezas pequeñas;
- taladrado, escariado, roscado y remachado;
- engastado de rubíes;
- placas y puentes;
- control de rebabas, concentricidad y acabado;
- útiles y herramientas de fabricación propia.

### Dominio J — Esferas, agujas, acabados y decoración — 16–24 unidades

- arquitectura y fabricación de esfera;
- pies, índices, impresión, lume y galvanoplastia;
- diseño, fabricación, equilibrado y ajuste de agujas;
- alturas y legibilidad;
- limado, lapidado, satinado, pulido y azulado;
- anglage, perlage, côtes y pulido negro;
- guilloché y engine turning;
- criterios visuales, geométricos y conservación de aristas.

### Dominio K — Complicaciones y arquitecturas — 24–36 unidades

- segundero central, pequeño y muerto;
- reserva de marcha;
- GMT, dual time y world time;
- calendario, anual y perpetuo;
- fase lunar;
- cronógrafo: mando, acoplamiento, conteo y variantes;
- flyback, rattrapante y foudroyante;
- repetidores y sonerías;
- tourbillon, remontoir, fusee y fuerza constante;
- ultraplano, esqueletado y arquitecturas especiales.

### Dominio L — Atlas, restauración y diseño propio — 20–28 unidades

- familias históricas y contemporáneas;
- lectura comparativa de 30–50 calibres;
- identificación, donantes y compatibilidad;
- ética y métodos de conservación/restauración;
- requisitos de un reloj completo;
- selección de movimiento adquirido;
- caja, esfera, agujas y cadena de cotas;
- modificación arquitectónica controlada;
- diseño de tren, energía, regulación y movimiento propio;
- BOM, riesgos, prototipos, verificación y dossier final.

## 13. Cómo debe escribirse cada unidad

Para evitar volver a crear mucho texto con poco conocimiento, cada unidad debe responder a una plantilla de **contenido**, no solo de estructura:

1. **Pregunta central.** Una cuestión técnica concreta y verificable.
2. **Prerrequisitos.** Conceptos atómicos que deben entenderse antes.
3. **Vocabulario.** Términos ES/EN/FR/DE que aparecerán.
4. **Modelo causal.** Entrada, interfaces, transformación, salida y pérdidas.
5. **Geometría y relaciones.** Qué toca, apoya, engrana, bloquea o impulsa qué.
6. **Magnitudes.** Unidades, órdenes de magnitud y variables relevantes.
7. **Teoría densa.** Desarrollo propio del tema; no metodología repetida.
8. **Ejemplo resuelto.** Con datos, pasos, unidades y verificación.
9. **Caso real.** Movimiento, pieza, proceso o documento concreto.
10. **Variantes.** Al menos dos arquitecturas cuando el concepto sea general.
11. **Fallos y errores mentales.** Síntomas, causas alternativas y discriminadores.
12. **Límites.** Qué simplifica el modelo y qué no puede concluirse.
13. **Fuentes por afirmación.** Localización y versión, no solo bibliografía final.
14. **Recuperación.** Preguntas que obliguen a reconstruir, no reconocer.
15. **Transferencia.** Aplicar el criterio a un caso no visto.

El marco común de fuente, práctica y cierre puede mostrarse una sola vez como norma de estudio. No debe repetirse palabra por palabra en cada lección para alcanzar una cuota.

## 14. Política editorial y de fuentes recomendada

### 14.1 Jerarquía

1. Documentación oficial del fabricante, normas y patentes para datos y procedimientos específicos.
2. Libros técnicos y programas formativos reconocidos para teoría general.
3. Artículos técnicos firmados, deconstrucciones y observaciones de ejemplares.
4. Bases de datos y glosarios para identificación y descubrimiento.
5. Contenido divulgativo para orientación, nunca para una tolerancia o procedimiento crítico.

### 14.2 Tipos de afirmación

Cada afirmación técnica debe etiquetarse como una de:

- oficial;
- bibliográfica;
- calculada;
- observada;
- medida;
- inferida;
- reconstrucción educativa;
- hipótesis;
- desconocida.

### 14.3 Citas mínimas

- dato de calibre: documento, revisión, página o tabla;
- fórmula: fuente, variables, unidades, hipótesis y versión;
- procedimiento: autoridad, alcance y calibre/material aplicable;
- fotografía: ejemplar, vista, autor, fecha y qué puede observarse;
- conclusión secundaria: autor y límites;
- norma: edición y cláusula cuando el texto esté disponible; una página comercial de ISO no sustituye la norma.

### 14.4 Revisión

- primera revisión editorial: claridad y dependencias;
- revisión técnica: exactitud de mecanismo y terminología;
- revisión de cálculo: derivación y unidades;
- revisión de caso: contraste con manual o ejemplar;
- prueba de principiante: detecta conocimiento asumido;
- revisión diferida: corrige lo que no se retiene o transfiere.

## 15. Plan de trabajo recomendado

### Fase C0 — Sanear el conocimiento actual

Prioridad máxima antes de añadir más temario.

1. Medir repetición y especificidad de las 87 lecciones visibles.
2. Reescribir las 44 unidades de avanzado, metrología y capstone que concentran el problema.
3. Separar el marco epistemológico común del contenido de cada tema.
4. Añadir claims a avanzado, metrología y capstone.
5. Corregir fuentes desalineadas y páginas ISO insuficientes.
6. Atomizar conceptos y completar prerrequisitos, especialmente 8215.
7. Crear errores conceptuales y glosario para todas las áreas.

**Resultado esperado:** el contenido existente pasa de “cumplir 600 palabras” a enseñar realmente su título.

### Fase C1 — Completar el tronco básico

1. Historia técnica, orientación, unidades y documentos.
2. Taller, herramientas, seguridad y materiales.
3. Física y matemáticas relojera previas a fórmulas.
4. Mecánica fundamental ampliada.
5. Cuarzo y diagnóstico eléctrico.
6. Servicio, lubricación y cronometría inicial.

Fuentes principales: Daniels capítulos 1–11, Ciechanowski, Theory of Horology cuando esté disponible, manuales oficiales y material formativo institucional.

### Fase C2 — Micromecánica y construcción

1. Daniels capítulos 2–7 y 12–13 convertidos en unidades verificadas.
2. Torneado, piezas pequeñas, rubíes, ruedas y piñones.
3. Cajas, esferas, agujas y decoración.
4. Casos de Dean DK, Bobinchak y Naked Watchmaker como observaciones, no autoridad única.
5. Prácticas físicas separadas de conocimiento digital.

### Fase C3 — Ingeniería relojera

1. Rederviar y validar el corpus VBA.
2. Ampliar los seis laboratorios hasta un curso completo.
3. Engranajes, Hertz, energía, espiral, tolerancias, materiales, estanqueidad y rotor.
4. MSA, FMEA, capacidad y fiabilidad conectadas al proyecto.

### Fase C4 — Especialidades, historia y atlas multimarca

1. Calendarios, cronógrafos, sonería y otras complicaciones.
2. Escapes comparados.
3. 30–50 calibres de referencia de distintas épocas y fabricantes.
4. Casos de servicio y fallos reales.
5. Historia técnica ligada a problemas de diseño.

### Fase C5 — Diseño y reloj propio

1. Reloj con movimiento adquirido.
2. Modificación controlada.
3. Componentes propios.
4. Arquitectura de movimiento propio.
5. Dossier, cálculos, prototipos, verificación y revisión relojera.

## 16. Objetivos cuantitativos útiles, sin convertirlos en cuotas vacías

Para la ambición máxima, una referencia razonable es:

| Elemento | Estado actual | Objetivo editorial aproximado |
|---|---:|---:|
| Lecciones/unidades visibles | 87 | 260–320 |
| Conceptos | 104 | 450–650 atómicos |
| Errores conceptuales | 14 | 100–150 documentados |
| Ejemplos resueltos específicos | Presencia formal, desigual | 250 o más |
| Problemas independientes | 154 actividades, varias genéricas | 350–500 variantes sustantivas |
| Casos de calibres/familias | Principalmente 2035 y 8215 | 30–50 casos curados |
| Claims | Parciales y concentrados | Cobertura de toda afirmación verificable |
| Glosario | Concentrado en cuatro paquetes | 500–800 términos relacionados |

Estas cifras sirven para dimensionar el trabajo. Ninguna unidad debe existir solo para alcanzar el número.

## 17. Criterios de aceptación del futuro contenido

Una expansión no debería considerarse completa salvo que:

1. El título de cada unidad corresponda al conocimiento específico que ocupa la mayor parte del texto.
2. La repetición literal de teoría entre unidades se mantenga por debajo del 10 %, excluyendo avisos obligatorios breves.
3. Cada afirmación técnica verificable tenga tipo, fuente, localización y alcance.
4. Ninguna fuente se use fuera de su dominio.
5. Los conceptos sean atómicos y tengan prerrequisitos coherentes.
6. Cada unidad introduzca vocabulario y errores plausibles propios.
7. Toda fórmula incluya unidades, hipótesis, derivación o autoridad y comprobaciones de límites.
8. Todo procedimiento distinga conocimiento, simulación, observación y destreza manual.
9. Cada tema general se contraste con al menos dos arquitecturas.
10. Cada tema avanzado llegue como mínimo a aplicación y diagnóstico, no solo definición.
11. Los calibres reales usen documentación oficial cuando exista.
12. Los casos visuales no se conviertan en medidas oficiales.
13. Los textos históricos u antiguos lleven contexto de época y seguridad moderna.
14. La revisión experta deje registro de quién, qué versión y qué limitaciones revisó.
15. Un alumno pueda explicar, calcular, diagnosticar y transferir lo aprendido sin depender de las opciones visibles.

## 18. Qué no conviene hacer

- Añadir decenas de rutas con una sola lección por materia.
- Copiar páginas o capítulos completos y llamarlo integración.
- Usar el mínimo de palabras como medida principal de calidad.
- Repetir en cada lección la política de fuentes, restauración y estudio.
- Tratar un modelo 3D como explicación suficiente.
- Generalizar desde 8215 o 2035 a todos los relojes.
- Convertir una base de datos secundaria en autoridad dimensional.
- Ejecutar las fórmulas VBA sin rederivarlas.
- Presentar procedimientos antiguos del libro sin revisión de seguridad.
- Confundir completar actividades digitales con saber trabajar en un reloj físico.
- Introducir complicaciones antes de dominar marcha, energía, escape y ajuste.

## 19. Configuración completa recomendada

La configuración coherente para la Academia es:

1. **Base sistémica y teoría densa antes del ejemplo.** Mantener el patrón P0/P1/P2.
2. **Dos modelos conceptuales universales.** Mecánico y cuarzo, claramente separados de marcas.
3. **2035 y 8215 como primeros casos oficiales.** No como centro permanente de todo el currículo.
4. **Daniels como columna de construcción mecánica.** Complementado con seguridad, materiales y teoría moderna.
5. **VBA como banco de ingeniería.** Revalidado fórmula por fórmula.
6. **Horology Student como red de fuentes.** Cada enlace con una función editorial distinta.
7. **WOSTEP/AWCI como mapas de cobertura.** Nunca como certificación implícita.
8. **Atlas multimarca e histórico.** Para lograr transferencia real.
9. **Claim-level provenance.** Obligatoria para conocimiento técnico.
10. **Separación estricta de conocimiento y destreza.** La Academia puede enseñar la teoría completa; el banco físico y la revisión humana demuestran ejecución.

## 20. Decisión final

La Academia no necesita otra reconstrucción de estructura. Necesita una **fase editorial de contenido de gran escala**.

El orden óptimo es:

```text
sanear las 87 lecciones actuales
→ completar fundamentos, herramientas, materiales y servicio
→ desarrollar micromecánica y construcción desde Daniels
→ desarrollar ingeniería desde VBA verificado
→ ampliar complicaciones, historia y atlas multimarca
→ cerrar con diseño y construcción de un reloj propio
```

La primera intervención recomendada es la Fase C0. Añadir contenido nuevo sin retirar antes la falsa profundidad consolidaría deuda editorial: habría más páginas, pero seguiría siendo difícil saber qué está realmente aprendido. Una vez saneado el núcleo, la arquitectura actual puede alojar una academia personal extraordinariamente amplia sin sacrificar trazabilidad ni rigor.

## 21. Fuentes y documentos de referencia

### Fuentes externas principales

- [Horology Student — Resources](https://horology-student.org/resources/)
- [Horology Student — Books](https://horology-student.org/resources/books/)
- [Bartosz Ciechanowski — Mechanical Watch](https://ciechanow.ski/mechanical-watch/)
- [Hodinkee — Watch 101](https://www.hodinkee.com/watch101)
- [17jewels.info — Movement Archive](https://17jewels.info/)
- [WOSTEP — Watchmaker Program](https://www.wostep.ch/en/training/watchmaker-program)
- [WOSTEP — Watchmaker Program Brochure](https://www.wostep.ch/sites/default/files/2025-12/P05-Watchmaker_brochure_en.pdf)
- [AWCI — Official Standards and Practices](https://www.awci.com/wp-content/uploads/2011/07/AWCI-standards-practicese.pdf)

### Fuentes locales principales

- `reference-library/originals/Horologia_completa_OCR_ligera_100MB.pdf`
- `reference-library/originals/VBAUhrentechnik.zip`
- `docs/AUDITORIA-VBA-UHRENTECHNIK.md`
- `docs/APRENDER-FUENTES-Y-LABORATORIOS-FUNDAMENTALES.md`
- `docs/APRENDER-INGENIERIA-RELOJERA.md`
- `docs/APRENDER-ACADEMIA-P1.md`
- `docs/APRENDER-ACADEMIA-P2.md`
- `learning-content/source-registry/horology-student-resources.v1.json`
