# Reforma pedagógica y editorial de Aprender

## Propósito

Esta reforma convierte la Academia de una colección técnica muy amplia en un recorrido que puede empezar una persona sin experiencia y terminar en trabajo relojero, fabricación y diseño propio. No reduce la teoría: la ordena, la conecta con observaciones y la presenta con una voz humana.

La unidad de calidad deja de ser «una lección suficientemente larga» y pasa a ser «una explicación que construye un modelo mental, muestra cómo se usa y permite comprobarlo sin adivinar».

## Principios no negociables

1. La primera hora debe crear un mapa funcional del reloj y un éxito observable.
2. Ningún término se evalúa antes de definirse en contexto.
3. La teoría puede ser extensa, pero debe estar segmentada por ideas, no por cuotas artificiales de palabras.
4. Una imagen o modelo utilizado para comprender está disponible durante la lectura; solo se bloquea la interacción evaluada.
5. Un ejemplo resuelto precede a la resolución independiente cuando el conocimiento es nuevo.
6. Historia, fuentes clásicas y casos de calibre profundizan un concepto ya presentado; no reinician el temario ni bloquean la orientación.
7. La práctica guiada, la demostración independiente, la transferencia y la retención son estados distintos y alcanzables.
8. El texto dirigido al estudiante no contiene vocabulario de implementación.
9. Procedencia, fidelidad y límites siguen siendo visibles, pero viven en una ficha técnica separada de la explicación.
10. Toda acción bloqueada explica qué falta y ofrece un camino directo para resolverlo.

## Columna vertebral

### 1. Orientación funcional desde cero

- reloj completo y movimiento;
- rueda, piñón, árbol, pivote, platina, puente y rubí;
- energía, ritmo, transmisión, indicación y estructura;
- cadena mecánica conceptual;
- cadena de cuarzo conceptual;
- equivalencias funcionales;
- primera interrupción guiada.

La lección sobre confianza documental del ISA 8172 se conserva como profundización opcional. No es un requisito para comprender por primera vez un reloj.

### 2. Observación, banco y herramientas esenciales

- postura, iluminación y aumento;
- orden y trazabilidad de piezas;
- manipulación segura;
- herramientas inmediatas;
- registro de una observación antes de medir o intervenir.

### 3. Fundamentos mecánicos

- muelle real y barrilete;
- tren y relaciones de engrane;
- escape;
- volante y espiral;
- minutería;
- cuerda y puesta en hora.

### 4. Matemáticas y metrología justo a tiempo

Cada herramienta matemática aparece cerca del problema que resuelve: razón de dientes antes de calcular un tren, unidades antes de medir e incertidumbre después de una primera medición sencilla.

### 5. Calibre real, servicio e interfaces

El conocimiento conceptual se transfiere a calibres documentados, desmontaje, montaje, lubricación, ajuste, diagnóstico, caja, esfera, agujas, tija, corona, hermeticidad y ergonomía.

### 6. Fabricación, diseño y validación

La progresión culmina en proyectos integradores: reloj con movimiento adquirido, paquete caja–esfera–agujas, cálculo de un tren, disposición de un subsistema, modificación controlada, mecanismo propio, movimiento propio y revisión independiente.

## Arquitectura de una lección

### Explicación guiada

Presenta la pregunta, activa conocimientos previos, define los términos al aparecer y construye la cadena causal. Debe poder entenderse sin conocer la arquitectura interna de la aplicación.

### Estudio en profundidad

Contiene la teoría extensa, fórmulas, variantes, historia, casos de fuente, contradicciones y consecuencias de diseño. No existe un límite corto de palabras: la extensión depende del conocimiento que haya que construir.

### Ficha técnica y fuentes

Agrupa procedencia, revisión, nivel G/K/P, alcance de la simulación, datos desconocidos y límites de validación. Esta capa conserva el rigor sin interrumpir la voz de la explicación.

### Ejemplo resuelto

Muestra el razonamiento completo: estado inicial, entrada, interfaz, transformación, salida, observación y límite. No se sustituye por una respuesta final sin proceso.

### Comprobación y práctica

La primera comprobación es próxima al ejemplo. La transferencia entre calibres o arquitecturas aparece después de que cada arquitectura haya sido presentada por separado.

## Voz editorial

La Academia habla directamente y explica antes de formalizar:

- «mecanismo interior (movimiento)» antes de usar solo «movimiento»;
- «mecanismo de cuerda y puesta en hora» antes de `keyless`;
- «modelo 3D estructural» en lugar de `fixture`;
- «estado guardado» en lugar de `snapshot`;
- «consolidado en otra sesión» en lugar de `retained`;
- «afirmación respaldada» en lugar de `claim`.

Los términos `runtime`, `WatchProject`, `namespace`, IDs canónicos y detalles del motor no pertenecen al Markdown del estudiante. G/K/P se muestra únicamente dentro de la ficha técnica del modelo.

## Apoyo visual

- Anatomía: ilustración o modelo anotado.
- Mecanismo: contactos reales, ruta de energía y sentidos de movimiento.
- Procedimiento: secuencia, criterio de parada y verificación.
- Matemáticas: diagrama y cálculo vinculado a piezas visibles.
- Historia: línea temporal y comparación de soluciones.
- Diagnóstico: síntoma, hipótesis, prueba discriminante y resultado.
- Diseño: requisitos, alternativas, interfaces, interferencias y validación.

El modelo puede consultarse durante la teoría. La respuesta, manipulación evaluada y registro de evidencia se desbloquean al completar la preparación necesaria.

## Dominio y retención

Una competencia recorre estados verificables:

1. práctica guiada;
2. apoyo reducido;
3. demostración independiente;
4. transferencia;
5. retención en otra sesión.

Ninguna competencia puede quedar atrapada en práctica indefinida. Una ruta opcional no cuenta como requisito para completar su núcleo.

## Controles editoriales

Las verificaciones automáticas deben detectar:

- preguntas gramaticalmente rotas;
- relaciones conceptuales generadas por posición;
- transiciones causales sin explicación específica;
- vocabulario interno dentro del texto estudiantil;
- términos evaluados antes de enseñarse;
- roles pedagógicos declarados que no se renderizan;
- repetición excesiva de frases;
- una actividad cuyo verbo promete una herramienta inexistente;
- prácticas sin camino a demostración y retención;
- contrastes, foco, navegación y bloqueos sin explicación.

La validación automática no sustituye la revisión humana de precisión relojera, claridad, seguridad ni transferencia a una pieza física.

## Implementación materializada

La reforma se aplica en tres capas coordinadas:

1. `academyCurriculum.ts` declara una única entrada desde cero y distingue columna vertebral, especializaciones y ampliaciones. Una ampliación nunca bloquea una ruta nuclear.
2. Los generadores de contenido conservan el orden, los prerrequisitos, la voz y la procedencia. La ruta inicial contiene diez prácticas con escenas de evaluación propias; la profundización documental del ISA 8172 conserva su ID, pero queda al final y es opcional.
3. La aplicación separa lectura, consulta del modelo, práctica guiada, demostración sin ayuda, transferencia y recuperación diferida. Cambiar de vista o recorrer el índice no acredita lectura ni dominio.

El catálogo integrado reúne ocho paquetes reales. El inventario instalado contiene 220 módulos, 225 lecciones y 292 actividades. El recorrido del estudiante expone 24 rutas, 217 módulos, 222 lecciones y 289 actividades; los tres elementos restantes son protocolos internos de pruebas con principiantes, accesibilidad y retención, y no cuentan para su progreso ni aparecen en el buscador. Las cifras se verifican en pruebas; no se mantienen como texto promocional independiente del contenido.

### Contenido y redacción

- La orientación define el vocabulario mínimo antes de evaluarlo.
- Las lecciones extensas conservan teoría, ejemplo resuelto, práctica y transferencia específicos del tema.
- Historia, mecanismo, procedimiento, diagnóstico, fabricación y diseño usan arquetipos distintos.
- Los libros clásicos sostienen teoría general dentro de su fecha y alcance. Los datos de un calibre siguen dependiendo de su fabricante y revisión aplicable.
- Los nombres internos, IDs y códigos de fidelidad no aparecen en la explicación. La metainformación técnica queda en **Fiabilidad y fuentes**.
- Las actividades y escenas se revisan como texto dirigido al estudiante, incluidas preguntas, opciones, pistas, feedback y alternativas accesibles.

### Evaluación y progreso

La demostración adaptativa abre una sesión independiente y sin pistas. Su regla exige evidencia válida del intento actual: una respuesta histórica correcta no puede ocultar un fallo presente. La transferencia solo se ofrece después de una demostración y se registra como contexto separado. La retención se comprueba mediante recuperaciones posteriores; una repetición inmediata no cuenta como consolidación.

### Puertas reproducibles

- `learning:academy-p1-audit` comprueba profundidad, teoría previa y práctica deliberada;
- `learning:academy-p2-audit` comprueba accesibilidad, recuperación y experiencia avanzada;
- `learning:content-quality-audit` comprueba arquetipos, fuentes, redacción visible, preguntas, relaciones y repetición;
- `npm run verify` reúne lint, pruebas, auditorías y build de producción.

### Verificación final de la reforma

La entrega congelada supera `npm run verify`: 103 archivos de prueba y 478 pruebas, las tres auditorías editoriales y el build de producción. La auditoría P1 cubre las 24 rutas visibles, 222 lecciones y 289 actividades con 2.890 controles aprobados. P2 cubre 509 conceptos, 149 errores conceptuales, 2.023 controles y sus nueve comprobaciones de ejecución. La auditoría de contenido revisa también los tres protocolos internos y queda en 225 lecciones y 292 actividades, sin fallos de redacción, repetición ni secuencia.

El corpus enciclopédico contiene 152.682 palabras, 129 fuentes registradas y 25 laboratorios visuales. Fundamentos mecánicos conserva además sus seis bloques teóricos previos al laboratorio y las 24 fuentes curadas del directorio Horology Student. Los ocho paquetes superan individualmente `learning:validate`; sus 3.869 entradas declaradas coinciden entre la fuente normalizada, `dist/pack.json` y el ZIP instalable. El glosario global fusiona la procedencia de los términos compartidos entre paquetes, de modo que deduplicar una definición no elimina ninguna de sus fuentes.

La guía de escritura y revisión se conserva en [APRENDER-GUIA-EDITORIAL.md](APRENDER-GUIA-EDITORIAL.md).

## Compatibilidad

La reforma conserva IDs de rutas, lecciones, actividades, competencias y evidencias siempre que sea posible. El nuevo orden y la condición opcional no invalidan progreso existente ni modifican proyectos técnicos.
