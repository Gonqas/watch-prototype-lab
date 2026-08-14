# Academy learner path 0.14B

> Manifiesto curado manualmente. No se deriva de los informes generados ni de la posición física de las lecciones.

## Identidad

- Path: `academy.path.watchmaker-main`
- Versión: 0.14B.0
- Objetivo: Comprender un reloj desde cero, trabajar sobre un movimiento mecánico real, construir un reloj completo alrededor de un movimiento adquirido, aprender a adaptar o fabricar componentes y avanzar hacia el diseño y validación de un movimiento propio.
- Auditoría fuente: 0.14A.1
- Estado de curación: manually-curated
- Cobertura: 8 etapas, 32 capítulos, 83 anchors, 30 apoyos, 83 prácticas requeridas y 8 ramas opcionales.
- Validación: 0 incidencias sobre 222 lecciones y 289 actividades visibles.

## Etapa 0. Preparar el banco y adquirir control

**Promesa:** Trabajar con orden y límites claros.

**Resultado:** Preparar el entorno y distinguir práctica virtual de destreza física.

**Razón:** La manipulación básica precede a cualquier desmontaje.

**Cobertura:** complete. **Prerrequisitos:** ninguno.

### 1. Banco, postura, iluminación y herramientas

- ID: `chapter.0.1`
- Por qué ahora: El control del entorno reduce errores antes de estudiar mecanismos o manipular componentes.
- Resultado: Preparar un banco virtual seguro y justificar la herramienta adecuada.
- Cobertura: complete
- Prerrequisitos: ninguno
- Duración verificable de prácticas requeridas: 24 min
- Anchors: `lesson.quartz2035.workstation` — El puesto de trabajo; `lesson.quartz2035.tools` — Herramientas fundamentales
- Apoyo: `lesson.encyclopedia.workshop-tools-materials.banco-y-seguridad` — Banco, postura, orden y seguridad
- Prácticas requeridas: `activity.quartz2035.prepare-workbench` — Preparar el banco; `activity.quartz2035.select-tools` — Seleccionar herramientas
- Ramas opcionales: `branch.quartz-initiation`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Entrada de baja carga cognitiva con objetivos observables y prácticas K/V ya implementadas.

Revisión de anchors:

- `lesson.quartz2035.workstation`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Su objetivo y sus dos prácticas verifican preparación del banco y detección de condiciones inseguras sin atribuir trabajo físico.
- `lesson.quartz2035.tools`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Presenta selección y rechazo de herramientas con una actividad virtual específica y segura.

### 2. Control, manipulación, limpieza y primeras evidencias

- ID: `chapter.0.2`
- Por qué ahora: La manipulación básica debe preceder a cualquier desmontaje.
- Resultado: Explicar una manipulación controlada y reconocer qué faltaría para demostrarla físicamente.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.0.1`
- Duración verificable de prácticas requeridas: 70 min
- Anchors: `lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion` — Observación, óptica y manipulación; `lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza` — Contaminación, limpieza y química segura
- Apoyo: `lesson.encyclopedia.workshop-tools-materials.bulova-destreza-basica` — Pasaporte de banco I: lupa, pinzas y destornillador
- Prácticas requeridas: `activity.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion` — Explicar y transferir: Observación, óptica y manipulación; `activity.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza` — Explicar y transferir: Contaminación, limpieza y química segura
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La ruta conceptual puede avanzar con K/V/R, pero la competencia de banco queda pendiente hasta disponer de evidencia P documentada.
- Curación: manual-curation, confianza high. Se conserva la progresión psicomotriz, separando aprendizaje conceptual de acreditación física.

Revisión de anchors:

- `lesson.encyclopedia.workshop-tools-materials.observacion-optica-manipulacion`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. El objetivo trata observación y manipulación; la actividad existente es K/V y no se confunde con ejecución física.
- `lesson.encyclopedia.workshop-tools-materials.contaminacion-y-limpieza`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Introduce contaminación y limpieza segura antes de intervenir, con límites operativos explícitos.

## Etapa 1. Entender el reloj como sistema

**Promesa:** Ver funciones antes que listas de piezas.

**Resultado:** Explicar la cadena funcional de un reloj y leer su documentación.

**Razón:** La visión general precede al detalle.

**Cobertura:** complete. **Prerrequisitos:** `stage.0`.

### 1. El reloj como sistema funcional

- ID: `chapter.1.1`
- Por qué ahora: La visión general debe preceder al detalle.
- Resultado: Clasificar una pieza por su función dentro del sistema completo.
- Cobertura: complete
- Prerrequisitos: `chapter.0.2`
- Duración verificable de prácticas requeridas: 8 min
- Anchors: `lesson.horology.system` — Un reloj no es una colección de ruedas
- Apoyo: `lesson.encyclopedia.mechanical-energy-trains.toh-movimiento-simple` — Movimiento mecánico simple como sistema cerrado
- Prácticas requeridas: `activity.horology.classify-subsystems` — Comprobar qué hace el tren de ruedas
- Ramas opcionales: `branch.history-context`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Una única vista funcional evita iniciar con una pared de componentes.

Revisión de anchors:

- `lesson.horology.system`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Lección inicial explícita con mapa funcional y práctica de clasificación; no exige prerrequisitos avanzados.

### 2. Cadena mecánica, cadena de cuarzo y equivalencias

- ID: `chapter.1.2`
- Por qué ahora: La comparación refuerza el modelo funcional sin convertir el cuarzo en requisito del itinerario mecánico.
- Resultado: Ordenar la cadena mecánica y emparejar equivalencias funcionales.
- Cobertura: complete
- Prerrequisitos: `chapter.1.1`
- Duración verificable de prácticas requeridas: 16 min
- Anchors: `lesson.horology.mechanical-chain` — La cadena mecánica; `lesson.horology.functional-equivalence` — Cuarzo y mecánico: equivalencias funcionales
- Apoyo: `lesson.horology.quartz-chain` — La cadena del cuarzo
- Prácticas requeridas: `activity.horology.order-mechanical-chain` — Ordenar la cadena mecánica; `activity.horology.match-functional-equivalents` — Emparejar equivalencias funcionales
- Ramas opcionales: `branch.quartz-theory`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Dos anchors de alta confianza comparan sistemas sin imponer una rama de cuarzo.

Revisión de anchors:

- `lesson.horology.mechanical-chain`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Objetivo causal y práctica de ordenación directamente alineados; gold set confirma arquetipo conceptual K/V.
- `lesson.horology.functional-equivalence`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. La transferencia entre cuarzo y mecánico es conceptual y no hereda riesgos históricos ni destreza física.

### 3. Vocabulario, documentación y procedencia

- ID: `chapter.1.3`
- Por qué ahora: Antes de usar datos técnicos hay que distinguir documentación oficial, teoría, caso y referencia.
- Resultado: Localizar una afirmación y justificar qué fuente puede sostenerla.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.1.2`
- Duración verificable de prácticas requeridas: 35 min
- Anchors: `lesson.encyclopedia.history-language.leer-documentacion` — Leer nombres, especificaciones, planos y manuales
- Apoyo: `lesson.encyclopedia.history-language.medir-el-tiempo` — Medir el tiempo: referencia, oscilador y contador; `lesson.advanced.atlas-authority` — Leer un movimiento con autoridad y procedencia
- Prácticas requeridas: `activity.encyclopedia.history-language.leer-documentacion` — Explicar y transferir: Leer nombres, especificaciones, planos y manuales
- Ramas opcionales: `branch.history-context`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. El recorrido necesita alfabetización documental, pero no hereda toda la ruta histórica.

Revisión de anchors:

- `lesson.encyclopedia.history-language.leer-documentacion`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Su objetivo observable y actividad enseñan lectura documental; se acepta tras revisar su sourceRole y mantener pendiente la precisión de cita.

## Etapa 2. Comprender los sistemas mecánicos

**Promesa:** Seguir energía, transmisión, escape, regulación e indicación.

**Resultado:** Explicar los subsistemas mecánicos y sus dependencias.

**Razón:** Las matemáticas aparecen cuando resuelven una necesidad.

**Cobertura:** complete. **Prerrequisitos:** `stage.1`.

### 1. Fuente de energía, muelle real y barrilete

- ID: `chapter.2.1`
- Por qué ahora: La energía es la causa inicial de todos los subsistemas posteriores.
- Resultado: Explicar la función del barrilete y predecir una interrupción de energía.
- Cobertura: complete
- Prerrequisitos: `chapter.1.3`
- Duración verificable de prácticas requeridas: 63 min
- Anchors: `lesson.mechanical.energy` — De energía almacenada a movimiento; `lesson.mechanical.barrel` — Muelle real y barrilete; `lesson.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete` — Muelle real, barrilete y curva de par
- Apoyo: `lesson.encyclopedia.math-physics-metrology.fuerza-par-energia` — Fuerza, par, trabajo, energía y potencia
- Prácticas requeridas: `activity.mechanical.classify-energy-functions` — Clasificar energía, transmisión, regulación e indicación; `activity.mechanical.load-unload-barrel` — Cargar y descargar un barrilete; `activity.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete` — Explicar y transferir: Muelle real, barrilete y curva de par
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Secuencia causal desde energía hasta entrega de par, con apoyo cuantitativo contextual.

Revisión de anchors:

- `lesson.mechanical.energy`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. El objetivo y la práctica presentan la cadena energética antes de componentes detallados.
- `lesson.mechanical.barrel`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. La actividad representa carga y descarga de forma virtual, con alcance explícito.
- `lesson.encyclopedia.mechanical-energy-trains.muelle-real-y-barrilete`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Aporta curva de par y vocabulario técnico como aplicación inmediata, no como muralla matemática.

### 2. Ruedas, piñones, relaciones y tren de rodaje

- ID: `chapter.2.2`
- Por qué ahora: Una vez disponible la energía, hay que seguir su transmisión.
- Resultado: Construir un tren virtual y justificar relación y sentido de giro.
- Cobertura: complete
- Prerrequisitos: `chapter.2.1`
- Duración verificable de prácticas requeridas: 63 min
- Anchors: `lesson.mechanical.gear-pair` — Ruedas, piñones y engrane; `lesson.mechanical.train` — Construir un tren de rodaje; `lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren` — Relaciones, velocidades y arquitectura del tren
- Apoyo: `lesson.encyclopedia.math-physics-metrology.toh-contar-tren` — Diseño inverso de un tren de conteo; `lesson.encyclopedia.mechanical-energy-trains.toh-engranaje-geometria` — Geometría del engrane relojero
- Prácticas requeridas: `activity.mechanical.predict-pair-direction` — Predecir el sentido de un par de ruedas; `activity.mechanical.build-train` — Construir un tren; `activity.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren` — Explicar y transferir: Relaciones, velocidades y arquitectura del tren
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Va del par de ruedas al tren y aplaza la geometría avanzada.

Revisión de anchors:

- `lesson.mechanical.gear-pair`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Presenta el par mínimo antes de construir un tren.
- `lesson.mechanical.train`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Su práctica reconstruye el sistema y comprueba la transmisión.
- `lesson.encyclopedia.mechanical-energy-trains.relaciones-y-arquitectura-del-tren`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Amplía relaciones y arquitectura con actividad visual alineada.

### 3. Escape y entrega de impulso

- ID: `chapter.2.3`
- Por qué ahora: El escape conecta transmisión y oscilador.
- Resultado: Ordenar fases y reconocer dónde se entrega o se detiene energía.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.2.2`
- Duración verificable de prácticas requeridas: 84 min
- Anchors: `lesson.mechanical.escapement` — El escape de áncora suizo; `lesson.encyclopedia.escapements-chronometry.geometria-del-escape` — Bloqueo, draw, caída, impulso y seguridad; `lesson.encyclopedia.escapements-chronometry.toh-escape-fases` — Fases completas del escape de áncora suizo
- Apoyo: `lesson.advanced.escapement-compare` — Escapes: funciones comunes y geometrías no transferibles
- Prácticas requeridas: `activity.mechanical.order-escapement-phases` — Ordenar las fases del escape; `activity.encyclopedia.escapements-chronometry.geometria-del-escape` — Explicar y transferir: Bloqueo, draw, caída, impulso y seguridad; `activity.encyclopedia.escapements-chronometry.toh-escape-fases` — Explicar y transferir: Fases completas del escape de áncora suizo
- Ramas opcionales: `branch.complications`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. La secuencia base precede a comparación y geometría avanzada.

Revisión de anchors:

- `lesson.mechanical.escapement`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Objetivo causal y práctica de secuencia centrados en las fases del escape.
- `lesson.encyclopedia.escapements-chronometry.geometria-del-escape`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Aporta vocabulario geométrico y seguridad como detalle inmediatamente útil.
- `lesson.encyclopedia.escapements-chronometry.toh-escape-fases`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Segunda representación conceptual para transferencia; fórmulas y locadores siguen fuera del alcance de 0.14B.

### 4. Volante, espiral, oscilación y marcha

- ID: `chapter.2.4`
- Por qué ahora: Después de comprender el escape puede estudiarse el regulador como sistema.
- Resultado: Distinguir frecuencia y amplitud y explicar la relación escape-oscilador.
- Cobertura: complete
- Prerrequisitos: `chapter.2.3`
- Duración verificable de prácticas requeridas: 63 min
- Anchors: `lesson.mechanical.oscillator` — Volante y espiral; `lesson.mechanical.escape-oscillator` — Escape y oscilador como sistema; `lesson.encyclopedia.escapements-chronometry.volante-y-espiral` — Volante, espiral, pitón, raqueta y frecuencia
- Apoyo: `lesson.encyclopedia.math-physics-metrology.oscilacion-amortiguamiento` — Oscilación, frecuencia, resonancia y amortiguamiento
- Prácticas requeridas: `activity.mechanical.distinguish-frequency-amplitude` — Diferenciar frecuencia y amplitud; `activity.mechanical.relate-escape-oscillator` — Relacionar escape y oscilador; `activity.encyclopedia.escapements-chronometry.volante-y-espiral` — Explicar y transferir: Volante, espiral, pitón, raqueta y frecuencia
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Integra escape y regulador antes de introducir perturbaciones y cronocomparación.

Revisión de anchors:

- `lesson.mechanical.oscillator`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Lección conceptual con actividad que separa magnitudes sin exigir ajuste físico.
- `lesson.mechanical.escape-oscillator`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Integra ambos subsistemas y produce una explicación causal.
- `lesson.encyclopedia.escapements-chronometry.volante-y-espiral`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Aporta anatomía y vocabulario técnico antes de regulación avanzada.

### 5. Minutería, cuerda y puesta en hora

- ID: `chapter.2.5`
- Por qué ahora: La indicación y el sistema de puesta en hora se entienden después del tren y el regulador.
- Resultado: Reconstruir estados de tija y construir la minutería virtual.
- Cobertura: complete
- Prerrequisitos: `chapter.2.4`
- Duración verificable de prácticas requeridas: 28 min
- Anchors: `lesson.mechanical.motion-works` — Minutería e indicación; `lesson.mechanical.keyless` — Cuerda y puesta en hora
- Apoyo: `lesson.encyclopedia.mechanical-energy-trains.minuteria-y-puesta-en-hora` — Minutería, cañón de minutos y puesta en hora
- Prácticas requeridas: `activity.mechanical.build-motion-works` — Construir la minutería; `activity.mechanical.reconstruct-crown-states` — Reconstruir estados de la tija
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Agrupa dos interfaces funcionales sin anticiparlas como requisitos de la visión general.

Revisión de anchors:

- `lesson.mechanical.motion-works`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Presenta la indicación con práctica de construcción virtual.
- `lesson.mechanical.keyless`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Se centra en estados de cuerda y puesta en hora con una secuencia observable.

### 6. Automático, calendario y ampliaciones funcionales

- ID: `chapter.2.6`
- Por qué ahora: Las ampliaciones se entienden mejor después del movimiento mecánico simple.
- Resultado: Seguir la carga automática y explicar un cambio de fecha.
- Cobertura: complete
- Prerrequisitos: `chapter.2.5`
- Duración verificable de prácticas requeridas: 84 min
- Anchors: `lesson.mechanical.automatic-calendar` — Carga automática y calendario básico; `lesson.encyclopedia.complications.automatico-y-reserva` — Automático, embragues y reserva de marcha; `lesson.encyclopedia.complications.calendarios` — Fecha, día, calendario anual y perpetuo
- Apoyo: `lesson.advanced.calendars` — Calendarios como acumulación, salto, retención y corrección; `lesson.advanced.chronograph-control` — Control de cronógrafo: levas y rueda de pilares
- Prácticas requeridas: `activity.mechanical.follow-automatic-energy` — Seguir la carga automática; `activity.encyclopedia.complications.automatico-y-reserva` — Explicar y transferir: Automático, embragues y reserva de marcha; `activity.encyclopedia.complications.calendarios` — Explicar y transferir: Fecha, día, calendario anual y perpetuo
- Ramas opcionales: `branch.complications`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Cierra fundamentos con ampliaciones inmediatas y mantiene complicaciones como rama.

Revisión de anchors:

- `lesson.mechanical.automatic-calendar`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Integra automático y calendario básico sin convertir complicaciones en requisito.
- `lesson.encyclopedia.complications.automatico-y-reserva`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Profundiza en embragues y reserva mediante una actividad visual.
- `lesson.encyclopedia.complications.calendarios`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Ofrece anatomía visual del calendario básico antes de variantes avanzadas.

## Etapa 3. Observar, medir y diagnosticar

**Promesa:** Pasar de observación a hipótesis comprobable.

**Resultado:** Inspeccionar, medir y defender un diagnóstico causal.

**Razón:** La inspección precede a la intervención.

**Cobertura:** complete. **Prerrequisitos:** `stage.2`.

### 1. Observar e inspeccionar antes de desmontar

- ID: `chapter.3.1`
- Por qué ahora: La inspección precede a la intervención.
- Resultado: Registrar una observación sin convertirla prematuramente en diagnóstico.
- Cobertura: complete
- Prerrequisitos: `chapter.2.6`
- Duración verificable de prácticas requeridas: 59 min
- Anchors: `lesson.metrology.observe-before-measuring` — Observar antes de medir; `lesson.metrology.inspection-findings` — Inspeccionar desgaste y daños; `lesson.encyclopedia.service-tribology.recepcion-y-linea-base` — Recepción, historia y línea base
- Apoyo: `lesson.encyclopedia.service-tribology.tm-inspeccion-previa` — Caso TM I: inspección antes de desmontar
- Prácticas requeridas: `activity.metrology.preparar-una-inspeccion` — Preparar una inspección; `activity.metrology.registrar-hallazgo` — Registrar hallazgo; `activity.encyclopedia.service-tribology.recepcion-y-linea-base` — Explicar y transferir: Recepción, historia y línea base
- Ramas opcionales: `branch.historical-cases`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Tres perspectivas compatibles fijan el hábito de observar antes de intervenir.

Revisión de anchors:

- `lesson.metrology.observe-before-measuring`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Objetivo y prácticas separan observación e hipótesis.
- `lesson.metrology.inspection-findings`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Estructura un hallazgo y su evidencia R sin atribuir inspección física.
- `lesson.encyclopedia.service-tribology.recepcion-y-linea-base`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Introduce recepción e historia como línea base previa al servicio.

### 2. Medir, registrar y comparar

- ID: `chapter.3.2`
- Por qué ahora: Una hipótesis solo puede comprobarse con observaciones comparables.
- Resultado: Elegir una medición y comunicar su límite sin inventar precisión.
- Cobertura: complete
- Prerrequisitos: `chapter.3.1`
- Duración verificable de prácticas requeridas: 36 min
- Anchors: `lesson.metrology.units-scale-resolution` — Unidades, escala y resolución; `lesson.metrology.instruments` — Instrumentos; `lesson.metrology.physical-measurement` — Medir piezas físicas
- Apoyo: `lesson.metrology.precision-accuracy-uncertainty` — Precisión, exactitud, repetibilidad e incertidumbre; `lesson.metrology.compare-data` — Comparar datos
- Prácticas requeridas: `activity.metrology.diferenciar-resolucion-y-precision` — Diferenciar resolución y precisión; `activity.metrology.seleccionar-instrumento` — Seleccionar instrumento; `activity.metrology.medir-diametro` — Medir diámetro
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La ruta conceptual puede avanzar con K/V/R, pero la competencia de banco queda pendiente hasta disponer de evidencia P documentada.
- Curación: manual-curation, confianza high. Metrología introducida por necesidad y con frontera física explícita.

Revisión de anchors:

- `lesson.metrology.units-scale-resolution`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Base cuantitativa explícita con práctica de resolución.
- `lesson.metrology.instruments`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. La selección de instrumento resuelve una necesidad concreta.
- `lesson.metrology.physical-measurement`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Conecta el registro con una pieza física, pero la actividad actual solo produce K/R y no acredita P.

### 3. Síntoma, hipótesis y prueba diagnóstica

- ID: `chapter.3.3`
- Por qué ahora: Diagnosticar requiere observación y medición previas.
- Resultado: Defender una hipótesis y explicar qué resultado la refutaría.
- Cobertura: complete
- Prerrequisitos: `chapter.3.2`
- Duración verificable de prácticas requeridas: 82 min
- Anchors: `lesson.horology.failure-prediction` — Predicción de fallos; `lesson.encyclopedia.service-tribology.diagnostico-y-control-final` — Diagnóstico causal y control final; `lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas` — Caso TM II: diagnóstico por síntomas y prueba discriminante
- Apoyo: `lesson.encyclopedia.atlas-restoration-design.tm-hamilton-992b` — Caso oficial TM III: Hamilton 992B
- Prácticas requeridas: `activity.horology.justify-hypothesis` — Justificar una hipótesis; `activity.encyclopedia.service-tribology.diagnostico-y-control-final` — Explicar y transferir: Diagnóstico causal y control final; `activity.encyclopedia.service-tribology.tm-diagnostico-sintomas` — Explicar y transferir: Caso TM II: diagnóstico por síntomas y prueba discriminante
- Ramas opcionales: `branch.historical-cases`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. La hipótesis se practica primero en modelo y después en casos documentales.

Revisión de anchors:

- `lesson.horology.failure-prediction`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Práctica de hipótesis, predicción y transferencia sobre un sistema conocido.
- `lesson.encyclopedia.service-tribology.diagnostico-y-control-final`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Alinea diagnóstico causal con control final.
- `lesson.encyclopedia.service-tribology.tm-diagnostico-sintomas`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Caso histórico con prueba discriminante y evidencia K/V/R, sin heredar peligro de la obra completa.

### 4. Limpieza, lubricación, servicio y criterios de aceptación

- ID: `chapter.3.4`
- Por qué ahora: El servicio se plantea después del diagnóstico, no antes.
- Resultado: Justificar una decisión de limpieza o lubricación y definir su aceptación.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.3.3`
- Duración verificable de prácticas requeridas: 105 min
- Anchors: `lesson.encyclopedia.service-tribology.limpieza-e-inspeccion` — Limpieza, inspección y clasificación de defectos; `lesson.encyclopedia.service-tribology.tribologia-y-lubricantes` — Tribología, lubricantes y cantidad aplicada; `lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control` — Montaje por funciones y puntos de control
- Apoyo: `lesson.advanced.service-clean-lube` — Limpieza y lubricación como decisiones documentadas
- Prácticas requeridas: `activity.encyclopedia.service-tribology.limpieza-e-inspeccion` — Explicar y transferir: Limpieza, inspección y clasificación de defectos; `activity.encyclopedia.service-tribology.tribologia-y-lubricantes` — Explicar y transferir: Tribología, lubricantes y cantidad aplicada; `activity.encyclopedia.service-tribology.montaje-y-puntos-de-control` — Explicar y transferir: Montaje por funciones y puntos de control
- Ramas opcionales: `branch.advanced-service`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Separamos criterio moderno de servicio y contexto histórico.

Revisión de anchors:

- `lesson.encyclopedia.service-tribology.limpieza-e-inspeccion`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Vincula limpieza con inspección y clasificación de defectos.
- `lesson.encyclopedia.service-tribology.tribologia-y-lubricantes`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Introduce lubricación como decisión documentada, no receta histórica.
- `lesson.encyclopedia.service-tribology.montaje-y-puntos-de-control`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Organiza el montaje por funciones y verificaciones parciales.

## Etapa 4. Trabajar sobre un calibre real

**Promesa:** Transferir los fundamentos a un MIYOTA 8215 documentado.

**Resultado:** Completar estudio, desmontaje, montaje y diagnóstico virtual del 8215.

**Razón:** Un calibre real se estudia después de entender sus subsistemas.

**Cobertura:** complete. **Prerrequisitos:** `stage.3`.

### 1. Identificación, documentación y arquitectura del MIYOTA 8215

- ID: `chapter.4.1`
- Por qué ahora: El calibre real se estudia después de comprender sus subsistemas.
- Resultado: Identificar un 8215, localizar una especificación y reconstruir sus capas.
- Cobertura: complete
- Prerrequisitos: `chapter.3.4`
- Duración verificable de prácticas requeridas: 48 min
- Anchors: `lesson.miyota8215.identify` — Identificar el MIYOTA 8215; `lesson.miyota8215.documentation` — Leer su documentación; `lesson.miyota8215.architecture` — Arquitectura general
- Apoyo: ninguno
- Prácticas requeridas: `activity.miyota8215.identify-calibre` — Identificar el calibre; `activity.miyota8215.locate-specification` — Localizar una especificación; `activity.miyota8215.classify-subsystems` — Clasificar subsistemas
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Tres unidades oficiales y estructurales abren la especialización mecánica real.

Revisión de anchors:

- `lesson.miyota8215.identify`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Usa identidad y procedencia antes de interpretar piezas.
- `lesson.miyota8215.documentation`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Practica documentación oficial y sus límites.
- `lesson.miyota8215.architecture`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Conecta el sistema funcional con la arquitectura real del calibre.

### 2. Subsistemas del MIYOTA 8215

- ID: `chapter.4.2`
- Por qué ahora: La arquitectura general se vuelve concreta subsistema a subsistema.
- Resultado: Relacionar cada subsistema del 8215 con su función y dependencia.
- Cobertura: complete
- Prerrequisitos: `chapter.4.1`
- Duración verificable de prácticas requeridas: 80 min
- Anchors: `lesson.miyota8215.automatic` — Rotor y carga automática; `lesson.miyota8215.winding-setting` — Cuerda manual y puesta en hora; `lesson.miyota8215.barrel-energy` — Barrilete y energía; `lesson.miyota8215.train` — Tren de rodaje; `lesson.miyota8215.escapement-oscillator` — Escape, volante y espiral
- Apoyo: `lesson.miyota8215.calendar` — Calendario
- Prácticas requeridas: `activity.miyota8215.follow-automatic` — Seguir la carga automática; `activity.miyota8215.reconstruct-winding-states` — Reconstruir estados de cuerda y puesta en hora; `activity.miyota8215.follow-barrel-energy` — Seguir la energía desde el barrilete; `activity.miyota8215.identify-train` — Identificar el tren; `activity.miyota8215.follow-escapement` — Seguir el escape
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Agrupa seis unidades existentes sin presentarlas como seis decisiones equivalentes.

Revisión de anchors:

- `lesson.miyota8215.automatic`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Transfiere la carga automática conceptual al 8215.
- `lesson.miyota8215.winding-setting`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Reconstruye estados de cuerda y puesta en hora específicos.
- `lesson.miyota8215.barrel-energy`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Sigue energía desde el barrilete real.
- `lesson.miyota8215.train`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Identifica el tren y permite comprobar una interrupción.
- `lesson.miyota8215.escapement-oscillator`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Transfiere escape y oscilador al modelo estructural del calibre.

### 3. Desmontaje guiado y reducción de ayuda

- ID: `chapter.4.3`
- Por qué ahora: La manipulación y la inspección ya se han trabajado antes del desmontaje.
- Resultado: Completar un desmontaje virtual independiente y documentar la secuencia.
- Cobertura: complete
- Prerrequisitos: `chapter.4.2`
- Duración verificable de prácticas requeridas: 72 min
- Anchors: `lesson.miyota8215.plan-disassembly` — Planificar el desmontaje; `lesson.miyota8215.guided-disassembly` — Desmontaje guiado; `lesson.miyota8215.assisted-free-disassembly` — Desmontaje asistido y libre
- Apoyo: ninguno
- Prácticas requeridas: `activity.miyota8215.create-disassembly-plan` — Crear plan de desmontaje; `activity.miyota8215.guided-disassembly` — Completar desmontaje guiado disponible; `activity.miyota8215.free-disassembly` — Realizar práctica libre
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. La secuencia conserva el andamiaje pedagógico real de las actividades.

Revisión de anchors:

- `lesson.miyota8215.plan-disassembly`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Exige plan antes de acción.
- `lesson.miyota8215.guided-disassembly`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Presenta la secuencia con apoyo explícito.
- `lesson.miyota8215.assisted-free-disassembly`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Reduce ayuda y comprueba transferencia virtual; no se etiqueta como P.

### 4. Inspección, montaje y verificaciones

- ID: `chapter.4.4`
- Por qué ahora: No se monta sin inspeccionar y no se espera al final para verificar.
- Resultado: Registrar un hallazgo y completar un montaje virtual con controles intermedios.
- Cobertura: complete
- Prerrequisitos: `chapter.4.3`
- Duración verificable de prácticas requeridas: 48 min
- Anchors: `lesson.miyota8215.inspection` — Inspección; `lesson.miyota8215.assembly-verification` — Montaje y comprobaciones
- Apoyo: ninguno
- Prácticas requeridas: `activity.miyota8215.inspect-parts` — Inspeccionar piezas; `activity.miyota8215.partial-verifications` — Realizar comprobaciones parciales
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Respeta inspección antes de intervención y verificación por capas.

Revisión de anchors:

- `lesson.miyota8215.inspection`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Pide inspección y resultado K/V/R sin afirmar observación física.
- `lesson.miyota8215.assembly-verification`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Integra montaje y verificación parcial como un solo contrato.

### 5. Diagnóstico, transferencia y dossier final

- ID: `chapter.4.5`
- Por qué ahora: El diagnóstico final necesita conocer arquitectura, secuencia e inspección del 8215.
- Resultado: Completar y defender un diagnóstico virtual del calibre.
- Cobertura: complete
- Prerrequisitos: `chapter.4.4`
- Duración verificable de prácticas requeridas: 24 min
- Anchors: `lesson.miyota8215.diagnosis-project` — Diagnóstico y proyecto final
- Apoyo: `lesson.advanced.service-disassembly` — Desmontar por dependencias, no por memoria
- Prácticas requeridas: `activity.miyota8215.complete-diagnosis` — Completar diagnóstico
- Ramas opcionales: `branch.quartz-initiation`, `branch.comparative-atlas`
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Una única puerta final evita que las actividades de diagnóstico compitan entre sí.

Revisión de anchors:

- `lesson.miyota8215.diagnosis-project`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Proyecto final con hipótesis, prueba, mastery-check y transferencia explícita.

## Etapa 5. Construir un reloj completo

**Promesa:** Integrar un reloj alrededor de un movimiento adquirido.

**Resultado:** Defender un dossier de compatibilidad con cobertura y vacíos explícitos.

**Razón:** Construir un reloj completo es un objetivo autónomo.

**Cobertura:** partial. **Prerrequisitos:** `stage.4`.

### 1. Requisitos y elección del movimiento

- ID: `chapter.5.1`
- Por qué ahora: Construir un reloj completo es un objetivo autónomo después del servicio de un calibre.
- Resultado: Redactar un pliego y seleccionar un movimiento con criterios verificables.
- Cobertura: complete
- Prerrequisitos: `chapter.4.5`
- Duración verificable de prácticas requeridas: 130 min
- Anchors: `lesson.capstone.design.requirements` — Pliego, usuario y arquitectura del producto; `lesson.capstone.design.acquired-movement` — Integración de un movimiento adquirido
- Apoyo: ninguno
- Prácticas requeridas: `activity.capstone.design.requirements` — Pliego, usuario y arquitectura del producto; `activity.capstone.design.acquired-movement` — Integración de un movimiento adquirido
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. El producto comienza por requisitos y selección, no por fabricar componentes.

Revisión de anchors:

- `lesson.capstone.design.requirements`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Contrato de pliego y arquitectura con resultado revisable.
- `lesson.capstone.design.acquired-movement`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Se centra explícitamente en integrar un movimiento adquirido.

### 2. Movimiento, caja, aro, tija y cadena axial

- ID: `chapter.5.2`
- Por qué ahora: Las interfaces estructurales condicionan esfera, agujas y cierre.
- Resultado: Construir una matriz de compatibilidad parcial movimiento-caja-mando.
- Cobertura: partial
- Prerrequisitos: `chapter.5.1`
- Duración verificable de prácticas requeridas: 105 min
- Anchors: `lesson.encyclopedia.cases-water.arquitectura-de-caja` — Arquitectura de caja y encaje del movimiento; `lesson.encyclopedia.cases-water.corona-tubo-y-tija` — Corona, tubo, tija y órganos de mando; `lesson.encyclopedia.cases-water.toh-exterior-interfaces` — Exterior del reloj como cadena de interfaces
- Apoyo: `lesson.capstone.manufacturing.case` — Caja y arquitectura exterior
- Prácticas requeridas: `activity.encyclopedia.cases-water.arquitectura-de-caja` — Explicar y transferir: Arquitectura de caja y encaje del movimiento; `activity.encyclopedia.cases-water.corona-tubo-y-tija` — Explicar y transferir: Corona, tubo, tija y órganos de mando; `activity.encyclopedia.cases-water.toh-exterior-interfaces` — Explicar y transferir: Exterior del reloj como cadena de interfaces
- Ramas opcionales: ninguna
- Contenido planificado: `stage5-gap.movement-holder`, `stage5-gap.caseback-clearance`
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Hay base real para caja y mando, pero faltan aro y holgura posterior verificables.

Revisión de anchors:

- `lesson.encyclopedia.cases-water.arquitectura-de-caja`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Objetivo explícito de arquitectura y encaje del movimiento.
- `lesson.encyclopedia.cases-water.corona-tubo-y-tija`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Cubre la cadena de mando y sus interfaces.
- `lesson.encyclopedia.cases-water.toh-exterior-interfaces`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Integra el exterior como cadena de interfaces.

### 3. Esfera, pies, agujas y apilamiento

- ID: `chapter.5.3`
- Por qué ahora: La cadena axial solo puede cerrarse después de fijar caja y mando.
- Resultado: Definir las interfaces conocidas y marcar como desconocidas las cotas todavía ausentes.
- Cobertura: partial
- Prerrequisitos: `chapter.5.2`
- Duración verificable de prácticas requeridas: 70 min
- Anchors: `lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera` — Arquitectura de esfera, pies, aberturas e interfaces; `lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste` — Agujas: geometría, masa, tubo, ajuste y alturas
- Apoyo: `lesson.capstone.manufacturing.hands` — Agujas, cañones y holguras
- Prácticas requeridas: `activity.encyclopedia.dials-hands-finishing.arquitectura-de-esfera` — Explicar y transferir: Arquitectura de esfera, pies, aberturas e interfaces; `activity.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste` — Explicar y transferir: Agujas: geometría, masa, tubo, ajuste y alturas
- Ramas opcionales: ninguna
- Contenido planificado: `stage5-gap.dial-feet`, `stage5-gap.dial-diameter`, `stage5-gap.hand-holes-fit`, `stage5-gap.hour-wheel-stack`
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Las interfaces existen, pero cuatro datos de compatibilidad siguen sin cobertura completa.

Revisión de anchors:

- `lesson.encyclopedia.dials-hands-finishing.arquitectura-de-esfera`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Cubre arquitectura, pies, aberturas e interfaces sin inventar medidas.
- `lesson.encyclopedia.dials-hands-finishing.agujas-geometria-y-ajuste`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Cubre geometría, tubos, ajuste y alturas de agujas.

### 4. Cristal, fondo, juntas, hermeticidad e interferencias

- ID: `chapter.5.4`
- Por qué ahora: El cierre solo puede evaluarse cuando la cadena axial ya está definida.
- Resultado: Enumerar interfaces de cierre y distinguir verificación disponible de ensayo pendiente.
- Cobertura: partial
- Prerrequisitos: `chapter.5.3`
- Duración verificable de prácticas requeridas: 70 min
- Anchors: `lesson.encyclopedia.cases-water.cristales-y-biseles` — Cristales, biseles, tensiones y adhesivos; `lesson.encyclopedia.cases-water.toh-materiales-exterior` — Materiales, cristales, juntas y fijaciones exteriores
- Apoyo: `lesson.encyclopedia.cases-water.pruebas-de-presion` — Pruebas de presión, condensación y límites de seguridad
- Prácticas requeridas: `activity.encyclopedia.cases-water.cristales-y-biseles` — Explicar y transferir: Cristales, biseles, tensiones y adhesivos; `activity.encyclopedia.cases-water.toh-materiales-exterior` — Explicar y transferir: Materiales, cristales, juntas y fijaciones exteriores
- Ramas opcionales: ninguna
- Contenido planificado: `stage5-gap.dynamic-interferences`
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Cristal y juntas están cubiertos; fondo, holgura e interferencias requieren blueprint y documentación oficial.

Revisión de anchors:

- `lesson.encyclopedia.cases-water.cristales-y-biseles`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Cubre cristal, bisel y tensiones con límites explícitos.
- `lesson.encyclopedia.cases-water.toh-materiales-exterior`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Integra materiales, juntas y fijaciones exteriores.

### 5. Montaje final, compatibilidad, piezas donantes y validación

- ID: `chapter.5.5`
- Por qué ahora: La validación integra todas las interfaces anteriores.
- Resultado: Defender un dossier de compatibilidad y registrar límites y pruebas pendientes.
- Cobertura: partial
- Prerrequisitos: `chapter.5.4`
- Duración verificable de prácticas requeridas: 155 min
- Anchors: `lesson.capstone.design.capstone` — Dossier integral y puerta de prototipo; `lesson.mechanical.final-project` — Integración y proyecto final; `lesson.capstone.validation.calibre-transfer` — Transferencia entre calibres y arquitecturas
- Apoyo: `lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto` — Restauración, donantes y fabricación de repuesto
- Prácticas requeridas: `activity.capstone.design.capstone` — Dossier integral y puerta de prototipo; `activity.mechanical.build-final-project` — Construir el proyecto final; `activity.capstone.validation.calibre-transfer` — Transferencia entre calibres y arquitecturas
- Ramas opcionales: `branch.historical-cases`
- Contenido planificado: `stage5-gap.final-assembly-verification`
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. El contenido existente permite dossier parcial, pero no cubre orden final ni verificación integral.

Revisión de anchors:

- `lesson.capstone.design.capstone`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Puerta de prototipo con dossier y revisión, no acreditación de fabricación.
- `lesson.mechanical.final-project`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Integra fallos, hipótesis y límites en un proyecto virtual.
- `lesson.capstone.validation.calibre-transfer`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Comprueba transferencia sin generalizar dimensiones entre calibres.

## Etapa 6. Reparar, adaptar y fabricar componentes

**Promesa:** Planificar intervenciones y fabricación sin fingir ejecución física.

**Resultado:** Defender procesos, riesgos, inspección y aceptación de componentes.

**Razón:** Fabricar componentes viene después de integrar componentes existentes.

**Cobertura:** source-review-required. **Prerrequisitos:** `stage.5`.

### 1. Micromecánica, herramientas y preparación

- ID: `chapter.6.1`
- Por qué ahora: Fabricar componentes viene después de integrar componentes existentes.
- Resultado: Definir datum, sujeción, secuencia e inspección de una pieza.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.5.5`
- Duración verificable de prácticas requeridas: 70 min
- Anchors: `lesson.encyclopedia.micromechanics.trazado-medicion-y-sujecion` — Trazado, referencias, medición y sujeción; `lesson.encyclopedia.micromechanics.torno-y-trabajo-entre-puntos` — Torno relojero, pinzas y trabajo entre puntos
- Apoyo: `lesson.encyclopedia.workshop-tools-materials.herramientas-y-afilado` — Herramientas de mano, ajuste y afilado
- Prácticas requeridas: `activity.encyclopedia.micromechanics.trazado-medicion-y-sujecion` — Explicar y transferir: Trazado, referencias, medición y sujeción; `activity.encyclopedia.micromechanics.torno-y-trabajo-entre-puntos` — Explicar y transferir: Torno relojero, pinzas y trabajo entre puntos
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La ruta conceptual puede avanzar con K/V/R, pero la competencia de banco queda pendiente hasta disponer de evidencia P documentada.
- Curación: manual-curation, confianza high. Dos anchors separan planificación digital de ejecución especialista y conservan riesgos como restricciones.

Revisión de anchors:

- `lesson.encyclopedia.micromechanics.trazado-medicion-y-sujecion`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Objetivo de trazado, referencia y sujeción con nivel specialist-workshop explícito.
- `lesson.encyclopedia.micromechanics.torno-y-trabajo-entre-puntos`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Introduce el torno como operación real de taller especializado, sin fingir ejecución.

### 2. Ejes, pivotes, tijas, rubíes y cojinetes

- ID: `chapter.6.2`
- Por qué ahora: Estas piezas exigen control previo de torno, referencias e inspección.
- Resultado: Proponer un proceso y criterio de aceptación sin declarar la pieza fabricada.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.6.1`
- Duración verificable de prácticas requeridas: 105 min
- Anchors: `lesson.encyclopedia.micromechanics.ejes-pivotes-y-reparacion` — Ejes, pivotes, hombros y sustitución de staffs; `lesson.encyclopedia.micromechanics.tornillos-muelles-y-pequenas-piezas` — Tornillos, pasadores, muelles y piezas pequeñas; `lesson.encyclopedia.micromechanics.platinas-puentes-y-jewelling` — Platinas, puentes, taladros, escariado y colocación de rubíes
- Apoyo: `lesson.encyclopedia.micromechanics.bulova-tija` — Pasaporte VI: fabricación y ajuste de una tija
- Prácticas requeridas: `activity.encyclopedia.micromechanics.ejes-pivotes-y-reparacion` — Explicar y transferir: Ejes, pivotes, hombros y sustitución de staffs; `activity.encyclopedia.micromechanics.tornillos-muelles-y-pequenas-piezas` — Explicar y transferir: Tornillos, pasadores, muelles y piezas pequeñas; `activity.encyclopedia.micromechanics.platinas-puentes-y-jewelling` — Explicar y transferir: Platinas, puentes, taladros, escariado y colocación de rubíes
- Ramas opcionales: `branch.bench-passports`
- Contenido planificado: ninguno
- Evidencia física: La ruta conceptual puede avanzar con K/V/R, pero la competencia de banco queda pendiente hasta disponer de evidencia P documentada.
- Curación: manual-curation, confianza high. La progresión de taller es válida, pero ninguna simulación acredita fabricación física.

Revisión de anchors:

- `lesson.encyclopedia.micromechanics.ejes-pivotes-y-reparacion`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Operaciones reales y nivel especialista revisados; la actividad sigue siendo K/V.
- `lesson.encyclopedia.micromechanics.tornillos-muelles-y-pequenas-piezas`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Amplía procesos de piezas pequeñas con riesgos y aceptación.
- `lesson.encyclopedia.micromechanics.platinas-puentes-y-jewelling`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Cubre taladro, escariado y rubíes como planificación especialista.

### 3. Ruedas, piñones, platinas y puentes

- ID: `chapter.6.3`
- Por qué ahora: Se abordan conjuntos mayores después de adquirir referencias y control de piezas pequeñas.
- Resultado: Defender un plan de fabricación y medición para rueda o puente.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.6.2`
- Duración verificable de prácticas requeridas: 145 min
- Anchors: `lesson.encyclopedia.micromechanics.ruedas-y-pinones` — Fabricación de ruedas, piñones y cortadores; `lesson.capstone.manufacturing.plates-bridges` — Platinas, puentes, apoyos y rubíes; `lesson.capstone.manufacturing.micromechanics` — Micromecánica: ejes, piñones, tornillos y muelles
- Apoyo: ninguno
- Prácticas requeridas: `activity.encyclopedia.micromechanics.ruedas-y-pinones` — Explicar y transferir: Fabricación de ruedas, piñones y cortadores; `activity.capstone.manufacturing.plates-bridges` — Platinas, puentes, apoyos y rubíes; `activity.capstone.manufacturing.micromechanics` — Micromecánica: ejes, piñones, tornillos y muelles
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La ruta conceptual puede avanzar con K/V/R, pero la competencia de banco queda pendiente hasta disponer de evidencia P documentada.
- Curación: manual-curation, confianza high. Los anchors tienen contratos de fabricación, nivel de ejecución y resultados revisables.

Revisión de anchors:

- `lesson.encyclopedia.micromechanics.ruedas-y-pinones`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Contrato de fabricación K/V/R y taller especialista revisado.
- `lesson.capstone.manufacturing.plates-bridges`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Integra apoyos, rubíes y criterios de aceptación.
- `lesson.capstone.manufacturing.micromechanics`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Planifica ejes, piñones, tornillos y muelles bajo un contrato común.

### 4. Repuestos, piezas donantes, cajas, esferas y acabados

- ID: `chapter.6.4`
- Por qué ahora: La decisión de intervención necesita dominio previo de interfaces y procesos.
- Resultado: Defender una estrategia de repuesto y un plan de acabado seguro.
- Cobertura: source-review-required
- Prerrequisitos: `chapter.6.3`
- Duración verificable de prácticas requeridas: 255 min
- Anchors: `lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto` — Restauración, donantes y fabricación de repuesto; `lesson.capstone.manufacturing.case` — Caja y arquitectura exterior; `lesson.capstone.manufacturing.dial` — Esfera, índices y superficies gráficas; `lesson.capstone.manufacturing.hands` — Agujas, cañones y holguras; `lesson.capstone.manufacturing.decoration` — Acabados y decoración funcionalmente seguros
- Apoyo: `lesson.encyclopedia.dials-hands-finishing.pulido-satinado-y-cepillado` — Pulido, satinado, cepillado y geometría
- Prácticas requeridas: `activity.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto` — Explicar y transferir: Restauración, donantes y fabricación de repuesto; `activity.capstone.manufacturing.case` — Caja y arquitectura exterior; `activity.capstone.manufacturing.dial` — Esfera, índices y superficies gráficas; `activity.capstone.manufacturing.hands` — Agujas, cañones y holguras; `activity.capstone.manufacturing.decoration` — Acabados y decoración funcionalmente seguros
- Ramas opcionales: `branch.historical-cases`
- Contenido planificado: ninguno
- Evidencia física: La ruta conceptual puede avanzar con K/V/R, pero la competencia de banco queda pendiente hasta disponer de evidencia P documentada.
- Curación: manual-curation, confianza high. Cierra adaptación y fabricación con contratos explícitos y revisión de seguridad.

Revisión de anchors:

- `lesson.encyclopedia.atlas-restoration-design.restauracion-y-fabricacion-de-repuesto`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Distingue donante, restauración y fabricación sin generalizar un caso.
- `lesson.capstone.manufacturing.case`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Contrato de fabricación de caja con revisión K/V/R.
- `lesson.capstone.manufacturing.dial`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Contrato de esfera y superficies gráficas.
- `lesson.capstone.manufacturing.hands`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Contrato de agujas, cañones y holguras.
- `lesson.capstone.manufacturing.decoration`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Acabado ligado a función y seguridad, no decoración aislada.

## Etapa 7. Diseñar y validar un reloj o movimiento propio

**Promesa:** Convertir requisitos en arquitectura, prototipo y validación.

**Resultado:** Defender una arquitectura propia y su dossier de validación independiente.

**Razón:** Diseñar un movimiento propio es una etapa avanzada.

**Cobertura:** complete. **Prerrequisitos:** `stage.6`.

### 1. Requisitos y arquitectura de un movimiento propio

- ID: `chapter.7.1`
- Por qué ahora: Diseñar un movimiento propio es una etapa avanzada posterior a integración y fabricación.
- Resultado: Definir requisitos, subsistemas, interfaces y decisiones de arquitectura.
- Cobertura: complete
- Prerrequisitos: `chapter.6.4`
- Duración verificable de prácticas requeridas: 190 min
- Anchors: `lesson.capstone.design.own-movement` — Arquitectura de un movimiento propio; `lesson.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio` — Ruta de diseño: de movimiento adquirido a movimiento propio; `lesson.advanced.architecture-capstone` — Proyecto: defender una arquitectura completa
- Apoyo: ninguno
- Prácticas requeridas: `activity.capstone.design.own-movement` — Arquitectura de un movimiento propio; `activity.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio` — Explicar y transferir: Ruta de diseño: de movimiento adquirido a movimiento propio; `activity.advanced.architecture-capstone` — Proyecto: defender una arquitectura completa
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Tres anchors forman una puerta de diseño sin requerir crear geometría ausente.

Revisión de anchors:

- `lesson.capstone.design.own-movement`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Objetivo explícito de arquitectura propia con evidencia K/R.
- `lesson.encyclopedia.atlas-restoration-design.de-movimiento-adquirido-a-propio`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Puente conceptual entre integración y movimiento propio.
- `lesson.advanced.architecture-capstone`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Exige defender una arquitectura completa y sus compromisos.

### 2. Diseño, tolerancias, fabricación y planificación del prototipo

- ID: `chapter.7.2`
- Por qué ahora: Una arquitectura necesita presupuestos verificables antes de fabricar.
- Resultado: Construir un plan de prototipo con tolerancias, aceptación y riesgos.
- Cobertura: complete
- Prerrequisitos: `chapter.7.1`
- Duración verificable de prácticas requeridas: 90 min
- Anchors: `lesson.encyclopedia.math-physics-metrology.tolerancias-y-fiabilidad` — Tolerancias, capacidad, FMEA y fiabilidad; `lesson.capstone.manufacturing.dfm-datums` — Diseño para fabricar, medir y revisar
- Apoyo: `lesson.advanced.ultra-thin` — Arquitectura extraplana y presupuesto axial
- Prácticas requeridas: `activity.encyclopedia.math-physics-metrology.tolerancias-y-fiabilidad` — Explicar y transferir: Tolerancias, capacidad, FMEA y fiabilidad; `activity.capstone.manufacturing.dfm-datums` — Diseño para fabricar, medir y revisar
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. Las matemáticas reaparecen cuando resuelven decisiones de tolerancia y fabricación.

Revisión de anchors:

- `lesson.encyclopedia.math-physics-metrology.tolerancias-y-fiabilidad`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Aplica tolerancia, capacidad y FMEA a una necesidad de diseño real.
- `lesson.capstone.manufacturing.dfm-datums`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Contrato DFM con datums y verificación; se reutiliza como conocimiento transversal, pero su anchor canónico permanece aquí.

### 3. Ensayo, iteración, dossier y validación independiente

- ID: `chapter.7.3`
- Por qué ahora: El diseño no termina hasta contrastar resultados con criterios independientes.
- Resultado: Defender un dossier de validación y registrar decisiones de iteración.
- Cobertura: complete
- Prerrequisitos: `chapter.7.2`
- Duración verificable de prácticas requeridas: 95 min
- Anchors: `lesson.metrology.final-project` — Proyecto final; `lesson.capstone.validation.watchmaker-review` — Revisión relojera independiente
- Apoyo: `lesson.capstone.design.capstone` — Dossier integral y puerta de prototipo
- Prácticas requeridas: `activity.metrology.defender-el-proyecto-final` — Defender el proyecto final; `activity.capstone.validation.watchmaker-review` — Revisión relojera independiente
- Ramas opcionales: ninguna
- Contenido planificado: ninguno
- Evidencia física: La evidencia K/V/R disponible permite avance conceptual; no se declara destreza física.
- Curación: manual-curation, confianza high. La validación exige resultado revisado y decisión humana sin afirmar prototipo físico fabricado.

Revisión de anchors:

- `lesson.metrology.final-project`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. El dossier y su defensa usan K/V/R y no confunden revisión con ejecución física.
- `lesson.capstone.validation.watchmaker-review`: título, objetivo, actividades, prerrequisitos y roles de fuente revisados. Revisión relojera independiente como cierre explícito del recorrido.

## Ramas opcionales no bloqueantes

| Rama | Etapa | Rutas | Uso |
|---|---:|---|---|
| Iniciación en cuarzo MIYOTA 2035 | stage.0 | `route.quartz2035.isa-to-2035` | Especialización práctica no bloqueante. |
| Historia y lenguaje relojero | stage.1 | `route.encyclopedia.history-language` | Contexto cultural e histórico. |
| Teoría del cuarzo | stage.1 | `route.encyclopedia.quartz-electronics` | Arquitectura electrónica como comparación. |
| Complicaciones | stage.2 | `route.encyclopedia.complications`, `route.advanced.architectures-complications` | Ampliaciones mecánicas posteriores a los fundamentos. |
| Casos históricos y restauración | stage.3 | `route.encyclopedia.atlas-restoration-design` | Casos para transferencia y contexto, no instrucciones modernas automáticas. |
| Método de servicio avanzado | stage.3 | `route.advanced.service-method` | Métodos documentales y procedimientos avanzados. |
| Atlas comparativo | stage.4 | `route.advanced.comparative-atlas` | Comparación entre familias y calibres. |
| Pasaportes de banco | stage.6 | `route.encyclopedia.workshop-tools-materials` | Progresión psicomotriz histórica con evidencia P separada. |
